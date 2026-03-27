import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/notifications/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      setNotifications(data);
      
      // Count unread
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      
      await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast.success('Marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      
      await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Remove from local state
      setNotifications(notifications.filter(n => n.id !== notificationId));
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      // Mark all unread as read
      await Promise.all(
        unreadNotifications.map(n =>
          fetch(`${API_URL}/api/notifications/${n.id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );
      
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ember mx-auto mb-4"></div>
          <p className="text-white">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="mb-4 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center">
                <Bell className="w-10 h-10 mr-3 text-ember" />
                Notifications
              </h1>
              <p className="text-gray-400 mt-2">
                {unreadCount > 0 ? (
                  <span className="text-ember font-semibold">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </span>
                ) : (
                  'All caught up!'
                )}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                className="bg-ember hover:bg-ember-light"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="py-16 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">No notifications yet</p>
              <p className="text-gray-500 text-sm mt-2">
                You'll see important announcements here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`${
                  notification.is_read
                    ? 'bg-gray-800/50 border-gray-700'
                    : 'bg-gradient-to-br from-ember-dark/50 to-blue-900/50 border-ember/30'
                } transition-all hover:scale-[1.01]`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="w-5 h-5 mr-2 text-ember" />
                        <h3 className="text-xl font-semibold text-white">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="ml-3 px-2 py-1 text-xs bg-ember text-white rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-300 mb-3 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center text-sm text-gray-400">
                        <span>From: {notification.sent_by_name}</span>
                        <span className="mx-2">•</span>
                        <span>
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="bg-ember hover:bg-ember-light"
                          title="Mark as read"
                          data-testid={`mark-read-btn-${notification.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteNotification(notification.id)}
                        title="Delete notification"
                        data-testid={`delete-notification-btn-${notification.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
