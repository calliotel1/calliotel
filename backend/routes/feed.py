"""
Feed Router - Intelligent Feed Algorithm
Personalized feed with engagement-based ranking and rich media support
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import logging
import os
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


class FeedPost(BaseModel):
    post_id: str
    channel_id: str
    channel_name: str
    author_id: str
    author_name: str
    content: str
    media_urls: List[str]
    likes_count: int
    comments_count: int
    created_at: str
    is_liked: bool
    is_author: bool
    engagement_score: float = 0.0


@router.get("/personalized", response_model=List[FeedPost])
async def get_personalized_feed(
    limit: int = 20,
    skip: int = 0,
    algorithm: str = "engagement",  # engagement, recent, popular
    current_user = Depends(get_current_user)
):
    """
    Get personalized feed using intelligent algorithm
    Algorithms:
    - engagement: Prioritize posts with high engagement
    - recent: Most recent posts first
    - popular: Most liked posts
    """
    try:
        user_id = current_user["_id"]
        
        # Get user's channel memberships
        memberships = await db.channel_members.find(
            {"user_id": user_id},
            {"_id": 0, "channel_id": 1}
        ).limit(1000).to_list(1000)
        
        if not memberships:
            return []
        
        channel_ids = [m["channel_id"] for m in memberships]
        
        # Get posts from these channels (with field projection for efficiency)
        posts = await db.posts.find(
            {"channel_id": {"$in": channel_ids}},
            {
                "_id": 0,
                "post_id": 1,
                "channel_id": 1,
                "author_id": 1,
                "content": 1,
                "media_urls": 1,
                "likes_count": 1,
                "comments_count": 1,
                "created_at": 1,
                "engagement_score": 1
            }
        ).limit(1000).to_list(1000)
        
        if not posts:
            return []
        
        # Calculate engagement score for each post
        for post in posts:
            post_age_hours = (
                datetime.now(timezone.utc) - datetime.fromisoformat(post["created_at"])
            ).total_seconds() / 3600
            
            # Engagement score formula: (likes + comments*2) / (age_hours + 2)^1.5
            # This prioritizes recent posts with high engagement
            engagement = post.get("likes_count", 0) + (post.get("comments_count", 0) * 2)
            post["engagement_score"] = engagement / ((post_age_hours + 2) ** 1.5)
        
        # Sort based on algorithm
        if algorithm == "engagement":
            posts.sort(key=lambda x: x["engagement_score"], reverse=True)
        elif algorithm == "recent":
            posts.sort(key=lambda x: x["created_at"], reverse=True)
        elif algorithm == "popular":
            posts.sort(
                key=lambda x: x.get("likes_count", 0) + x.get("comments_count", 0),
                reverse=True
            )
        
        # Apply pagination
        posts = posts[skip : skip + limit]
        
        # Get user's likes
        post_ids = [p["post_id"] for p in posts]
        likes = await db.post_likes.find(
            {"post_id": {"$in": post_ids}, "user_id": user_id},
            {"_id": 0, "post_id": 1}
        ).limit(1000).to_list(1000)
        liked_posts = {like["post_id"] for like in likes}
        
        # OPTIMIZATION: Batch fetch all authors and channels to avoid N+1 queries
        # Extract unique author IDs and channel IDs
        author_ids = list(set(post["author_id"] for post in posts))
        channel_ids_list = list(set(post["channel_id"] for post in posts))
        
        # Fetch all authors in one query
        authors = await db.users.find(
            {
                "$or": [
                    {"_id": {"$in": author_ids}},
                    {"email": {"$in": author_ids}},
                    {"user_id": {"$in": author_ids}}
                ]
            },
            {"_id": 0, "email": 1, "full_name": 1, "user_id": 1}
        ).limit(len(author_ids)).to_list(len(author_ids) if len(author_ids) > 0 else 1)
        
        # Create author lookup dictionary (handle multiple ID fields)
        author_lookup = {}
        for author in authors:
            for id_field in ["_id", "email", "user_id"]:
                if id_field in author and author[id_field]:
                    author_lookup[author[id_field]] = author
        
        # Fetch all channels in one query
        channels = await db.channels.find(
            {"channel_id": {"$in": channel_ids_list}},
            {"_id": 0, "channel_id": 1, "name": 1}
        ).limit(len(channel_ids_list)).to_list(len(channel_ids_list) if len(channel_ids_list) > 0 else 1)
        
        # Create channel lookup dictionary
        channel_lookup = {ch["channel_id"]: ch for ch in channels}
        
        # Enrich posts with author and channel info (using lookups, no DB queries in loop)
        result = []
        for post in posts:
            # Lookup author info from dictionary (O(1) instead of DB query)
            author = author_lookup.get(post["author_id"])
            
            # Lookup channel info from dictionary (O(1) instead of DB query)
            channel = channel_lookup.get(post["channel_id"])
            
            result.append(FeedPost(
                post_id=post["post_id"],
                channel_id=post["channel_id"],
                channel_name=channel["name"] if channel else "Unknown",
                author_id=post["author_id"],
                author_name=author.get("full_name") or author["email"] if author else "Unknown",
                content=post["content"],
                media_urls=post.get("media_urls", []),
                likes_count=post.get("likes_count", 0),
                comments_count=post.get("comments_count", 0),
                created_at=post["created_at"],
                is_liked=post["post_id"] in liked_posts,
                is_author=post["author_id"] == user_id,
                engagement_score=post["engagement_score"]
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting personalized feed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get feed")


@router.get("/trending-posts")
async def get_trending_posts(
    hours: int = 24,
    limit: int = 10,
    current_user = Depends(get_current_user)
):
    """
    Get trending posts across all public channels in last N hours
    """
    try:
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        # Get recent posts from public channels (Atlas-optimized with explicit limit)
        posts = await db.posts.find(
            {"created_at": {"$gte": cutoff_time.isoformat()}},
            {"_id": 0}
        ).limit(1000).to_list(1000)
        
        if not posts:
            return {"trending": []}
        
        # Calculate engagement scores
        for post in posts:
            engagement = post.get("likes_count", 0) + (post.get("comments_count", 0) * 2)
            post["engagement_score"] = engagement
        
        # Sort by engagement
        posts.sort(key=lambda x: x["engagement_score"], reverse=True)
        posts = posts[:limit]
        
        # Enrich with channel info
        result = []
        for post in posts:
            channel = await db.channels.find_one(
                {"channel_id": post["channel_id"]},
                {"_id": 0, "name": 1, "is_public": 1}
            )
            
            if channel and channel.get("is_public", False):
                author = await db.users.find_one(
                    {
                        "$or": [
                            {"_id": post["author_id"]},
                            {"email": post["author_id"]},
                            {"user_id": post["author_id"]}
                        ]
                    },
                    {"_id": 0, "email": 1, "full_name": 1}
                )
                
                result.append({
                    "post_id": post["post_id"],
                    "channel_id": post["channel_id"],
                    "channel_name": channel["name"],
                    "author_name": author.get("full_name") or author["email"] if author else "Unknown",
                    "content": post["content"][:200],  # Preview
                    "media_urls": post.get("media_urls", []),
                    "likes_count": post.get("likes_count", 0),
                    "comments_count": post.get("comments_count", 0),
                    "engagement_score": post["engagement_score"]
                })
        
        return {"trending": result}
        
    except Exception as e:
        logger.error(f"Error getting trending posts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get trending posts")


@router.get("/media-feed")
async def get_media_feed(
    media_type: str = "all",  # all, image, video
    limit: int = 20,
    skip: int = 0,
    current_user = Depends(get_current_user)
):
    """
    Get feed filtered by media type (images/videos only)
    """
    try:
        user_id = current_user["_id"]
        
        # Get user's channel memberships
        memberships = await db.channel_members.find(
            {"user_id": user_id},
            {"_id": 0, "channel_id": 1}
        ).limit(1000).to_list(1000)
        
        if not memberships:
            return {"posts": []}
        
        channel_ids = [m["channel_id"] for m in memberships]
        
        # Query for posts with media
        query = {
            "channel_id": {"$in": channel_ids},
            "media_urls": {"$exists": True, "$ne": []}
        }
        
        posts = await db.posts.find(query, {"_id": 0}).sort(
            "created_at", -1
        ).skip(skip).limit(limit).to_list(limit)
        
        if not posts:
            return {"posts": []}
        
        # Filter by media type if specified
        if media_type != "all":
            filtered_posts = []
            for post in posts:
                media_urls = post.get("media_urls", [])
                if media_type == "image":
                    # Check if URLs contain image extensions
                    has_images = any(
                        url.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))
                        for url in media_urls
                    )
                    if has_images:
                        filtered_posts.append(post)
                elif media_type == "video":
                    # Check if URLs contain video extensions
                    has_videos = any(
                        url.lower().endswith(('.mp4', '.mov', '.avi', '.webm'))
                        for url in media_urls
                    )
                    if has_videos:
                        filtered_posts.append(post)
            posts = filtered_posts
        
        # Get user's likes
        post_ids = [p["post_id"] for p in posts]
        likes = await db.post_likes.find(
            {"post_id": {"$in": post_ids}, "user_id": user_id},
            {"_id": 0, "post_id": 1}
        ).limit(1000).to_list(1000)
        liked_posts = {like["post_id"] for like in likes}
        
        # Enrich posts
        result = []
        for post in posts:
            author = await db.users.find_one(
                {
                    "$or": [
                        {"_id": post["author_id"]},
                        {"email": post["author_id"]},
                        {"user_id": post["author_id"]}
                    ]
                },
                {"_id": 0, "email": 1, "full_name": 1}
            )
            
            channel = await db.channels.find_one(
                {"channel_id": post["channel_id"]},
                {"_id": 0, "name": 1}
            )
            
            result.append({
                "post_id": post["post_id"],
                "channel_id": post["channel_id"],
                "channel_name": channel["name"] if channel else "Unknown",
                "author_name": author.get("full_name") or author["email"] if author else "Unknown",
                "content": post["content"],
                "media_urls": post.get("media_urls", []),
                "likes_count": post.get("likes_count", 0),
                "comments_count": post.get("comments_count", 0),
                "created_at": post["created_at"],
                "is_liked": post["post_id"] in liked_posts,
                "is_author": post["author_id"] == user_id
            })
        
        return {"posts": result}
        
    except Exception as e:
        logger.error(f"Error getting media feed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get media feed")


@router.get("/recommendations")
async def get_feed_recommendations(
    limit: int = 10,
    current_user = Depends(get_current_user)
):
    """
    Get recommended posts based on user activity
    """
    try:
        user_id = current_user["_id"]
        
        # Get user's liked posts to understand interests
        user_likes = await db.post_likes.find(
            {"user_id": user_id},
            {"_id": 0, "post_id": 1}
        ).limit(100).to_list(100)
        
        liked_post_ids = [like["post_id"] for like in user_likes]
        
        # Get channels from liked posts
        liked_posts = await db.posts.find(
            {"post_id": {"$in": liked_post_ids}},
            {"_id": 0, "channel_id": 1}
        ).limit(100).to_list(100)
        
        interested_channels = list(set([p["channel_id"] for p in liked_posts]))
        
        # Get user's joined channels
        memberships = await db.channel_members.find(
            {"user_id": user_id},
            {"_id": 0, "channel_id": 1}
        ).limit(1000).to_list(1000)
        joined_channels = [m["channel_id"] for m in memberships]
        
        # Recommend posts from channels user showed interest but hasn't joined
        recommendation_channels = [c for c in interested_channels if c not in joined_channels]
        
        if not recommendation_channels:
            # Fall back to popular posts from public channels (Atlas-optimized with filters)
            # Only query posts from last 7 days to prevent cluster overload
            seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
            popular_posts = await db.posts.find(
                {"created_at": {"$gte": seven_days_ago.isoformat()}},
                {"_id": 0}
            ).sort("likes_count", -1).limit(limit).to_list(limit)
            
            result = []
            for post in popular_posts:
                channel = await db.channels.find_one(
                    {"channel_id": post["channel_id"]},
                    {"_id": 0, "name": 1, "is_public": 1}
                )
                
                if channel and channel.get("is_public", False):
                    author = await db.users.find_one(
                        {
                            "$or": [
                                {"_id": post["author_id"]},
                                {"email": post["author_id"]},
                                {"user_id": post["author_id"]}
                            ]
                        },
                        {"_id": 0, "email": 1, "full_name": 1}
                    )
                    
                    result.append({
                        "post_id": post["post_id"],
                        "channel_id": post["channel_id"],
                        "channel_name": channel["name"],
                        "author_name": author.get("full_name") or author["email"] if author else "Unknown",
                        "content": post["content"][:200],
                        "media_urls": post.get("media_urls", []),
                        "likes_count": post.get("likes_count", 0),
                        "reason": "Popular post"
                    })
            
            return {"recommendations": result}
        
        # Get recent posts from recommended channels (Atlas-optimized)
        recommended_posts = await db.posts.find(
            {"channel_id": {"$in": recommendation_channels}},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        result = []
        for post in recommended_posts:
            channel = await db.channels.find_one(
                {"channel_id": post["channel_id"]},
                {"_id": 0, "name": 1}
            )
            
            author = await db.users.find_one(
                {
                    "$or": [
                        {"_id": post["author_id"]},
                        {"email": post["author_id"]},
                        {"user_id": post["author_id"]}
                    ]
                },
                {"_id": 0, "email": 1, "full_name": 1}
            )
            
            result.append({
                "post_id": post["post_id"],
                "channel_id": post["channel_id"],
                "channel_name": channel["name"] if channel else "Unknown",
                "author_name": author.get("full_name") or author["email"] if author else "Unknown",
                "content": post["content"][:200],
                "media_urls": post.get("media_urls", []),
                "likes_count": post.get("likes_count", 0),
                "reason": f"Based on your interest in {channel['name'] if channel else 'this channel'}"
            })
        
        return {"recommendations": result}
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get recommendations")
