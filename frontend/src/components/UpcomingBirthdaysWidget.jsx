import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { Calendar, Gift, Cake, ChevronRight } from 'lucide-react';
import SendBirthdayWishModal from './SendBirthdayWishModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const UpcomingBirthdaysWidget = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showWishModal, setShowWishModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUpcomingBirthdays();
    }
  }, [user]);

  const fetchUpcomingBirthdays = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/birthdays/upcoming-birthdays`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBirthdays(response.data.upcoming_birthdays || []);
    } catch (error) {
      console.error('Error fetching upcoming birthdays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWish = (friend) => {
    setSelectedFriend(friend);
    setShowWishModal(true);
  };

  const getDaysText = (days) => {
    if (days === 0) return 'Today! 🎉';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  if (!user) return null;

  return (
    <>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Cake className={`w-6 h-6 ${darkMode ? 'text-ember-400' : 'text-ember-600'}`} />
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Upcoming Birthdays
            </h3>
          </div>
          {birthdays.length > 0 && (
            <span className="bg-ember/50 text-white text-xs font-bold px-2 py-1 rounded-full">
              {birthdays.length}
            </span>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ember-600 mx-auto"></div>
          </div>
        ) : birthdays.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No upcoming birthdays in the next 7 days
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {birthdays.slice(0, 5).map((birthday) => (
              <div
                key={birthday.friend_id}
                className={`${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                } rounded-lg p-4 transition-colors ${birthday.is_today ? 'ring-2 ring-pink-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {birthday.friend_name}
                      </h4>
                      {birthday.is_today && (
                        <span className="bg-gradient-to-r from-ember/50 to-ember-light text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                          TODAY!
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {getDaysText(birthday.days_until)}
                    </p>
                  </div>

                  {birthday.is_today && (
                    <button
                      onClick={() => handleSendWish(birthday)}
                      className="bg-gradient-to-r from-ember/50 to-ember-light text-white px-4 py-2 rounded-lg font-semibold hover:from-ember hover:to-ember-light transition-all transform hover:scale-105 flex items-center space-x-1"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Wish</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {birthdays.length > 5 && (
              <button
                className={`w-full py-2 text-center text-sm font-semibold ${
                  darkMode ? 'text-ember-400 hover:text-ember-light' : 'text-ember-600 hover:text-ember-700'
                } flex items-center justify-center space-x-1`}
              >
                <span>View all {birthdays.length} birthdays</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Send Wish Modal */}
      {selectedFriend && (
        <SendBirthdayWishModal
          isOpen={showWishModal}
          onClose={() => {
            setShowWishModal(false);
            setSelectedFriend(null);
          }}
          friend={{
            id: selectedFriend.friend_id,
            name: selectedFriend.friend_name
          }}
        />
      )}
    </>
  );
};

export default UpcomingBirthdaysWidget;
