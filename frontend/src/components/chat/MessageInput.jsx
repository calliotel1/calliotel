import React from 'react';
import { Camera, Smile, Send, Mic, Clock, Video } from 'lucide-react';
import { STICKER_CATEGORIES } from '../../data/stickers';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MessageInput = ({
  messageText,
  onMessageChange,
  onSendMessage,
  onScheduleMessage,
  sending,
  showStickers,
  onToggleStickers,
  onShowCamera,
  onShowVideoRecorder,
  onShowVoiceRecorder,
  selectedCategory,
  onSelectCategory,
  onSendSticker,
  customStickers,
  loadingStickers,
  onFetchCustomStickers,
  onSendCustomSticker
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Sticker Picker */}
      {showStickers && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            <button
              onClick={() => {
                onSelectCategory('custom');
                onFetchCustomStickers();
              }}
              className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-all ${
                selectedCategory === 'custom'
                  ? 'bg-gradient-to-r from-ember to-ember-light text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              ✨ Custom
            </button>
            {Object.entries(STICKER_CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                onClick={() => onSelectCategory(key)}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-all ${
                  selectedCategory === key
                    ? 'bg-ember text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          {/* Custom Stickers */}
          {selectedCategory === 'custom' ? (
            <div>
              {loadingStickers ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ember"></div>
                </div>
              ) : customStickers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-3">No custom stickers yet</p>
                  <button
                    onClick={() => navigate('/stickers/create')}
                    className="px-4 py-2 bg-gradient-to-r from-ember to-ember-light text-white text-sm rounded-lg hover:from-ember hover:to-ember-light transition-all"
                  >
                    Create Sticker
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto mb-3">
                    {customStickers.map((sticker) => (
                      <button
                        key={sticker.id}
                        onClick={() => onSendCustomSticker(sticker.url)}
                        className="aspect-square hover:scale-105 transition-transform p-2 hover:bg-white rounded-lg"
                        title={sticker.name}
                      >
                        <img
                          src={`${BACKEND_URL}${sticker.url}`}
                          alt={sticker.name}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/stickers/my')}
                    className="w-full text-center text-sm text-ember hover:text-ember-light font-semibold"
                  >
                    Manage Stickers →
                  </button>
                </>
              )}
            </div>
          ) : (
            // Default emoji stickers
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
              {STICKER_CATEGORIES[selectedCategory].stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => onSendSticker(sticker.id)}
                  className="text-4xl hover:scale-110 transition-transform p-2 hover:bg-white rounded-lg"
                  title={sticker.name}
                >
                  {sticker.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={onShowCamera}
            className="p-3 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
            title="Take Photo"
          >
            <Camera className="w-5 h-5" />
          </button>
          <button
            onClick={onShowVideoRecorder}
            className="p-3 bg-ember/10 text-ember hover:bg-ember/20 rounded-lg transition-all"
            title="Record Video"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={onShowVoiceRecorder}
            className="p-3 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
            title="Record Voice Note"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleStickers}
            className={`p-3 rounded-lg transition-all ${
              showStickers ? 'bg-ember/10 text-ember' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            onClick={onScheduleMessage}
            disabled={!messageText.trim()}
            className="p-3 bg-blue-100 text-ember hover:bg-blue-200 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Schedule Message"
            data-testid="schedule-message-btn"
          >
            <Clock className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={onSendMessage}
            disabled={sending || !messageText.trim()}
            className="px-6 py-3 bg-gradient-to-br from-ember to-ember-light text-white rounded-lg hover:from-ember hover:to-ember-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};

export default MessageInput;
