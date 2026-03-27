import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import VideoReactionPicker from './VideoReactionPicker';
import VideoReactionDisplay from './VideoReactionDisplay';
import VideoViewTracker from './VideoViewTracker';

const PostCard = ({ post, onLike, onUnlike, onDelete, onNavigate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const handleLike = (e) => {
    e.stopPropagation();
    if (post.is_liked) {
      onUnlike(post.post_id);
    } else {
      onLike(post.post_id);
    }
  };

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const isVideo = (url) => {
    return url.toLowerCase().match(/\.(mp4|mov|avi|webm)$/);
  };

  const isImage = (url) => {
    return url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
  };

  const renderMediaGrid = () => {
    if (!post.media_urls || post.media_urls.length === 0) return null;

    const mediaItems = post.media_urls.slice(0, 4);
    const hasMore = post.media_urls.length > 4;

    return (
      <div className={`mb-3 gap-2 ${
        mediaItems.length === 1
          ? 'grid grid-cols-1'
          : mediaItems.length === 2
            ? 'grid grid-cols-2'
            : 'grid grid-cols-2'
      }`}>
        {mediaItems.map((url, idx) => (
          <div
            key={idx}
            className="relative group overflow-hidden rounded-lg bg-gray-100"
            style={{ aspectRatio: mediaItems.length === 1 ? '16/9' : '1/1' }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMedia(url);
            }}
          >
            {isVideo(url) ? (
              <>
                <VideoViewTracker videoId={`post_${post.post_id}_${idx}`} source="feed" />
                <video
                  src={url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" />
                  </div>
                </div>
                {/* Video Reactions Overlay */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <VideoReactionDisplay videoId={`post_${post.post_id}_${idx}`} />
                  <VideoReactionPicker videoId={`post_${post.post_id}_${idx}`} />
                </div>
              </>
            ) : isImage(url) ? (
              <img
                src={url}
                alt="Post media"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-gray-500 text-sm">Media</span>
              </div>
            )}
            {idx === 3 && hasMore && (
              <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  +{post.media_urls.length - 4}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      onClick={() => onNavigate(post.post_id)}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer p-4 border border-gray-100"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {post.author_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{post.author_name}</p>
            <p className="text-xs text-gray-500">
              in <span className="text-ember font-medium">{post.channel_name}</span> • {formatTime(post.created_at)}
            </p>
          </div>
        </div>

        {post.is_author && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(post.post_id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-gray-800 whitespace-pre-wrap line-clamp-4">
          {post.content}
        </p>
      </div>

      {/* Media */}
      {renderMediaGrid()}

      {/* Media Lightbox */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedMedia(null);
          }}
        >
          {isVideo(selectedMedia) ? (
            <video
              src={selectedMedia}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={selectedMedia}
              alt="Full size media"
              className="max-w-full max-h-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 transition-colors ${
              post.is_liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{post.likes_count}</span>
          </button>

          <button className="flex items-center space-x-1 text-gray-600 hover:text-ember transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comments_count}</span>
          </button>
        </div>

        <button className="text-gray-600 hover:text-ember transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PostCard;
