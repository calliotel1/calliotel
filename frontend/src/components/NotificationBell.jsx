import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NotificationBell = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return (
    <Button
      onClick={() => navigate('/notifications')}
      variant="ghost"
      className="relative hover:bg-gray-700 text-gray-300 hover:text-white"
      title="Notifications"
      data-testid="notification-bell-button"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span 
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse"
          data-testid="notification-unread-badge"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
};

export default NotificationBell;
