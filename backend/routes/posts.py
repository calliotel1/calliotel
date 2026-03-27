"""
Posts Router
Manage posts (content) in channels with likes and comments
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from typing import Optional, List
import logging
import os
from uuid import uuid4
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Pydantic Models
class CreatePostRequest(BaseModel):
    channel_id: str
    content: str = Field(..., min_length=1, max_length=5000)
    media_urls: Optional[List[str]] = []

class UpdatePostRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

class PostResponse(BaseModel):
    post_id: str
    channel_id: str
    channel_name: str
    author_id: str
    author_name: str
    author_avatar: Optional[str]
    content: str
    media_urls: List[str]
    likes_count: int
    comments_count: int
    created_at: str
    is_liked: bool = False
    is_author: bool = False

class CommentResponse(BaseModel):
    comment_id: str
    post_id: str
    author_id: str
    author_name: str
    content: str
    likes_count: int
    created_at: str
    is_liked: bool = False
    is_author: bool = False

@router.post("/create", response_model=PostResponse)
async def create_post(
    request: CreatePostRequest,
    current_user = Depends(get_current_user)
):
    """Create a new post in a channel"""
    try:
        user_id = current_user["_id"]
        
        # Check if user is member of channel
        membership = await db.channel_members.find_one(
            {"channel_id": request.channel_id, "user_id": user_id}
        )
        if not membership:
            raise HTTPException(status_code=403, detail="Must be a member to post")
        
        # Get channel info
        channel = await db.channels.find_one(
            {"channel_id": request.channel_id},
            {"_id": 0, "name": 1}
        )
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        post_id = str(uuid4())
        
        # Create post
        post = {
            "post_id": post_id,
            "channel_id": request.channel_id,
            "author_id": user_id,
            "content": request.content,
            "media_urls": request.media_urls or [],
            "likes_count": 0,
            "comments_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.posts.insert_one(post)
        
        # Update channel post count
        await db.channels.update_one(
            {"channel_id": request.channel_id},
            {"$inc": {"post_count": 1}}
        )
        
        logger.info(f"Post created: {post_id} in channel {request.channel_id}")
        
        return PostResponse(
            **post,
            channel_name=channel["name"],
            author_name=current_user.get("full_name") or current_user["email"],
            author_avatar=None,
            is_liked=False,
            is_author=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating post: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create post")

@router.get("/feed", response_model=List[PostResponse])
async def get_feed(
    limit: int = 20,
    skip: int = 0,
    current_user = Depends(get_current_user)
):
    """Get personalized feed from joined channels"""
    try:
        user_id = current_user["_id"]
        
        # Get user's channel memberships
        memberships = await db.channel_members.find(
            {"user_id": user_id},
            {"_id": 0, "channel_id": 1}
        ).to_list(1000)
        
        if not memberships:
            return []
        
        channel_ids = [m["channel_id"] for m in memberships]
        
        # Get posts from these channels
        posts = await db.posts.find(
            {"channel_id": {"$in": channel_ids}},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        if not posts:
            return []
        
        # Get user's likes
        post_ids = [p["post_id"] for p in posts]
        likes = await db.post_likes.find(
            {"post_id": {"$in": post_ids}, "user_id": user_id},
            {"_id": 0, "post_id": 1}
        ).to_list(1000)
        liked_posts = {like["post_id"] for like in likes}
        
        # BATCH FETCH: Get all authors and channels at once to avoid N+1 queries
        author_ids = list({post["author_id"] for post in posts})
        channel_ids = list({post["channel_id"] for post in posts})
        
        # Fetch all authors in one query
        authors_cursor = db.users.find(
            {"$or": [{"_id": {"$in": author_ids}}, {"email": {"$in": author_ids}}, {"user_id": {"$in": author_ids}}]},
            {"_id": 0, "email": 1, "user_id": 1, "full_name": 1}
        )
        authors_list = await authors_cursor.to_list(1000)
        
        # Create lookup dict for authors (by email, user_id, or _id)
        authors_lookup = {}
        for author in authors_list:
            key = author.get("user_id") or author.get("email")
            if key:
                authors_lookup[key] = author
        
        # Fetch all channels in one query
        channels_cursor = db.channels.find(
            {"channel_id": {"$in": channel_ids}},
            {"_id": 0, "channel_id": 1, "name": 1}
        )
        channels_list = await channels_cursor.to_list(1000)
        channels_lookup = {ch["channel_id"]: ch for ch in channels_list}
        
        # Enrich posts using lookup dicts (no more N+1 queries!)
        result = []
        for post in posts:
            # Get author from lookup
            author = authors_lookup.get(post["author_id"])
            
            # Get channel from lookup
            channel = channels_lookup.get(post["channel_id"])
            
            result.append(PostResponse(
                **post,
                channel_name=channel["name"] if channel else "Unknown",
                author_name=author.get("full_name") or author.get("email") if author else "Unknown",
                author_avatar=None,
                is_liked=post["post_id"] in liked_posts,
                is_author=post["author_id"] == user_id
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting feed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get feed")

@router.get("/channel/{channel_id}", response_model=List[PostResponse])
async def get_channel_posts(
    channel_id: str,
    limit: int = 20,
    skip: int = 0,
    current_user = Depends(get_current_user)
):
    """Get posts from a specific channel"""
    try:
        user_id = current_user["_id"]
        
        # Check if user can view this channel
        channel = await db.channels.find_one({"channel_id": channel_id})
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        if channel["is_private"]:
            membership = await db.channel_members.find_one(
                {"channel_id": channel_id, "user_id": user_id}
            )
            if not membership:
                raise HTTPException(status_code=403, detail="Cannot view private channel")
        
        # Get posts
        posts = await db.posts.find(
            {"channel_id": channel_id},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        if not posts:
            return []
        
        # Get user's likes
        post_ids = [p["post_id"] for p in posts]
        likes = await db.post_likes.find(
            {"post_id": {"$in": post_ids}, "user_id": user_id},
            {"_id": 0, "post_id": 1}
        ).to_list(1000)
        liked_posts = {like["post_id"] for like in likes}
        
        # Enrich posts
        result = []
        for post in posts:
            author = await db.users.find_one(
                {"$or": [{"_id": post["author_id"]}, {"email": post["author_id"]}, {"user_id": post["author_id"]}]},
                {"_id": 0, "email": 1, "full_name": 1}
            )
            
            result.append(PostResponse(
                **post,
                channel_name=channel["name"],
                author_name=author.get("full_name") or author["email"] if author else "Unknown",
                author_avatar=None,
                is_liked=post["post_id"] in liked_posts,
                is_author=post["author_id"] == user_id
            ))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting channel posts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get posts")

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    current_user = Depends(get_current_user)
):
    """Get single post"""
    try:
        user_id = current_user["_id"]
        
        post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check access to channel
        channel = await db.channels.find_one({"channel_id": post["channel_id"]})
        if channel["is_private"]:
            membership = await db.channel_members.find_one(
                {"channel_id": post["channel_id"], "user_id": user_id}
            )
            if not membership:
                raise HTTPException(status_code=403, detail="Cannot view this post")
        
        # Check if liked
        liked = await db.post_likes.find_one({"post_id": post_id, "user_id": user_id})
        
        # Get author info - use _id (email) or email field for lookup
        author = await db.users.find_one(
            {"$or": [{"_id": post["author_id"]}, {"email": post["author_id"]}, {"user_id": post["author_id"]}]},
            {"_id": 0, "email": 1, "full_name": 1}
        )
        
        return PostResponse(
            **post,
            channel_name=channel["name"],
            author_name=author.get("full_name") or author["email"] if author else "Unknown",
            author_avatar=None,
            is_liked=liked is not None,
            is_author=post["author_id"] == user_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting post: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get post")

@router.put("/{post_id}")
async def update_post(
    post_id: str,
    request: UpdatePostRequest,
    current_user = Depends(get_current_user)
):
    """Update post (author only)"""
    try:
        user_id = current_user["_id"]
        
        post = await db.posts.find_one({"post_id": post_id})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        if post["author_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only author can edit post")
        
        await db.posts.update_one(
            {"post_id": post_id},
            {"$set": {"content": request.content}}
        )
        
        logger.info(f"Post {post_id} updated")
        return {"message": "Post updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating post: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update post")

@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user = Depends(get_current_user)
):
    """Delete post (author or channel admin)"""
    try:
        user_id = current_user["_id"]
        
        post = await db.posts.find_one({"post_id": post_id})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check if author or channel admin
        is_author = post["author_id"] == user_id
        membership = await db.channel_members.find_one(
            {"channel_id": post["channel_id"], "user_id": user_id}
        )
        is_admin = membership and membership["role"] == "admin"
        
        if not is_author and not is_admin:
            raise HTTPException(status_code=403, detail="Not authorized to delete")
        
        # Delete post, likes, and comments
        await db.posts.delete_one({"post_id": post_id})
        await db.post_likes.delete_many({"post_id": post_id})
        await db.comments.delete_many({"post_id": post_id})
        
        # Update channel post count
        await db.channels.update_one(
            {"channel_id": post["channel_id"]},
            {"$inc": {"post_count": -1}}
        )
        
        logger.info(f"Post {post_id} deleted")
        return {"message": "Post deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting post: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete post")

@router.post("/{post_id}/like")
async def like_post(
    post_id: str,
    current_user = Depends(get_current_user)
):
    """Like a post"""
    try:
        user_id = current_user["_id"]
        
        # Check if post exists
        post = await db.posts.find_one({"post_id": post_id})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check if already liked
        existing = await db.post_likes.find_one({"post_id": post_id, "user_id": user_id})
        if existing:
            return {"message": "Already liked"}
        
        # Add like
        like = {
            "post_id": post_id,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.post_likes.insert_one(like)
        
        # Update like count
        await db.posts.update_one(
            {"post_id": post_id},
            {"$inc": {"likes_count": 1}}
        )
        
        return {"message": "Post liked"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error liking post: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to like post")

@router.delete("/{post_id}/like")
async def unlike_post(
    post_id: str,
    current_user = Depends(get_current_user)
):
    """Unlike a post"""
    try:
        user_id = current_user["_id"]
        
        # Remove like
        result = await db.post_likes.delete_one({"post_id": post_id, "user_id": user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Not liked")
        
        # Update like count
        await db.posts.update_one(
            {"post_id": post_id},
            {"$inc": {"likes_count": -1}}
        )
        
        return {"message": "Post unliked"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unliking post: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to unlike post")

# Comments endpoints
class AddCommentRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

@router.post("/{post_id}/comments", response_model=CommentResponse)
async def add_comment(
    post_id: str,
    request: AddCommentRequest,
    current_user = Depends(get_current_user)
):
    """Add comment to post"""
    try:
        user_id = current_user["_id"]
        
        # Check if post exists
        post = await db.posts.find_one({"post_id": post_id})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        comment_id = str(uuid4())
        
        # Create comment
        comment = {
            "comment_id": comment_id,
            "post_id": post_id,
            "author_id": user_id,
            "content": request.content,
            "likes_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.comments.insert_one(comment)
        
        # Update post comment count
        await db.posts.update_one(
            {"post_id": post_id},
            {"$inc": {"comments_count": 1}}
        )
        
        logger.info(f"Comment added to post {post_id}")
        
        return CommentResponse(
            **comment,
            author_name=current_user.get("full_name") or current_user["email"],
            is_liked=False,
            is_author=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding comment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add comment")

@router.get("/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(
    post_id: str,
    current_user = Depends(get_current_user)
):
    """Get comments for a post"""
    try:
        # Get comments
        comments = await db.comments.find(
            {"post_id": post_id},
            {"_id": 0}
        ).sort("created_at", 1).to_list(1000)
        
        if not comments:
            return []
        
        user_id = current_user["_id"]
        
        # Enrich with author info
        result = []
        for comment in comments:
            author = await db.users.find_one(
                {"$or": [{"_id": comment["author_id"]}, {"email": comment["author_id"]}, {"user_id": comment["author_id"]}]},
                {"_id": 0, "email": 1, "full_name": 1}
            )
            
            result.append(CommentResponse(
                **comment,
                author_name=author.get("full_name") or author["email"] if author else "Unknown",
                is_liked=False,  # TODO: Implement comment likes if needed
                is_author=comment["author_id"] == user_id
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting comments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get comments")

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user = Depends(get_current_user)
):
    """Delete comment (author only)"""
    try:
        user_id = current_user["_id"]
        
        comment = await db.comments.find_one({"comment_id": comment_id})
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        if comment["author_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only author can delete comment")
        
        # Delete comment
        await db.comments.delete_one({"comment_id": comment_id})
        
        # Update post comment count
        await db.posts.update_one(
            {"post_id": comment["post_id"]},
            {"$inc": {"comments_count": -1}}
        )
        
        logger.info(f"Comment {comment_id} deleted")
        return {"message": "Comment deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting comment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete comment")
