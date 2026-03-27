import React from 'react';
import { Users, Lock, TrendingUp } from 'lucide-react';

const ChannelCard = ({ channel, onJoin, onLeave, onNavigate }) => {
  const handleAction = (e) => {
    e.stopPropagation();
    if (channel.is_member) {
      onLeave(channel.channel_id);
    } else {
      onJoin(channel.channel_id);
    }
  };

  return (
    <div
      onClick={() => onNavigate(channel.channel_id)}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-100"
    >
      {/* Channel Avatar/Banner */}
      <div className="h-32 bg-gradient-to-br from-ember to-ember-light relative">
        {channel.avatar_url ? (
          <img 
            src={channel.avatar_url} 
            alt={channel.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-12 h-12 text-white opacity-80" />
          </div>
        )}
        {channel.is_private && (
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-2">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Channel Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
              {channel.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {channel.description}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{channel.member_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>{channel.post_count.toLocaleString()} posts</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAction}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
            channel.is_member
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gradient-to-r from-ember to-ember-light text-white hover:from-ember hover:to-ember-light'
          }`}
        >
          {channel.is_member ? 'Joined' : 'Join Channel'}
        </button>

        {channel.is_admin && (
          <div className="mt-2 text-xs text-center text-ember font-semibold">
            👑 Admin
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelCard;
