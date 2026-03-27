import React from 'react';
import { MessageSquare, UserPlus } from 'lucide-react';

const FriendList = ({ 
  friends, 
  selectedFriend, 
  loading, 
  onSelectFriend, 
  onAddFriend,
  formatTime 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-bold text-gray-900">Friends</h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ember"></div>
        </div>
      ) : friends.length === 0 ? (
        <div className="p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No friends yet</p>
          <button
            onClick={onAddFriend}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all"
          >
            Add Friends
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {friends.map((friend) => (
            <button
              key={friend.user_id}
              onClick={() => onSelectFriend(friend)}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                selectedFriend?.user_id === friend.user_id ? 'bg-ember/5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {friend.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {friend.full_name || friend.email}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {friend.last_message || 'No messages yet'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {formatTime(friend.last_message_time)}
                  </p>
                  {friend.unread_count > 0 && (
                    <span className="inline-block mt-1 w-5 h-5 bg-ember text-white rounded-full text-xs flex items-center justify-center">
                      {friend.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendList;
