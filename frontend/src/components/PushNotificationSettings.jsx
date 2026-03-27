import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, TestTube, Loader2 } from 'lucide-react';
import pushNotificationManager from '../utils/pushNotificationManager';
import { useToast } from '../hooks/use-toast';

const PushNotificationSettings = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const initialized = await pushNotificationManager.initialize();
      setIsSupported(initialized);
      
      if (initialized) {
        const subscribed = await pushNotificationManager.isSubscribed();
        setIsSubscribed(subscribed);
        setPermission(pushNotificationManager.getPermissionState());
      }
    } catch (error) {
      console.error('Error checking push status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      setLoading(true);
      const result = await pushNotificationManager.requestPermission();
      
      if (result.success) {
        setIsSubscribed(true);
        setPermission('granted');
        toast({
          title: 'Success!',
          description: 'Push notifications enabled'
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please allow notifications in browser settings',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      setLoading(true);
      await pushNotificationManager.unsubscribe();
      setIsSubscribed(false);
      toast({
        title: 'Disabled',
        description: 'Push notifications turned off'
      });
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setTesting(true);
      await pushNotificationManager.sendTestNotification();
      toast({
        title: 'Test Sent!',
        description: 'Check for notification popup'
      });
    } catch (error) {
      console.error('Error sending test:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test notification',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 text-ember animate-spin" />
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 text-gray-600">
          <BellOff className="w-6 h-6" />
          <div>
            <p className="font-semibold">Push Notifications Not Supported</p>
            <p className="text-sm">Your browser doesn't support push notifications</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {isSubscribed ? (
            <Bell className="w-6 h-6 text-green-600" />
          ) : (
            <BellOff className="w-6 h-6 text-gray-400" />
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-600">
              {isSubscribed ? 'Receive alerts even when app is closed' : 'Get notified on lock screen'}
            </p>
          </div>
        </div>
        
        {isSubscribed ? (
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-600">Enabled</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <X className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-600">Disabled</span>
          </div>
        )}
      </div>

      {/* Status Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 mb-1">Permission</p>
            <p className={`font-semibold ${
              permission === 'granted' ? 'text-green-600' : 
              permission === 'denied' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {permission === 'granted' ? '✓ Granted' : 
               permission === 'denied' ? '✗ Denied' : '○ Not Set'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Status</p>
            <p className={`font-semibold ${isSubscribed ? 'text-green-600' : 'text-gray-600'}`}>
              {isSubscribed ? '✓ Active' : '○ Inactive'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {!isSubscribed ? (
          <button
            onClick={handleEnableNotifications}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enabling...</span>
              </>
            ) : (
              <>
                <Bell className="w-5 h-5" />
                <span>Enable Push Notifications</span>
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={handleTestNotification}
              disabled={testing}
              className="w-full py-3 bg-ember/10 hover:bg-ember/20 text-ember-700 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {testing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <TestTube className="w-5 h-5" />
                  <span>Send Test Notification</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleDisableNotifications}
              disabled={loading}
              className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Disabling...</span>
                </>
              ) : (
                <>
                  <BellOff className="w-5 h-5" />
                  <span>Disable Push Notifications</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ What you'll receive:</strong>
        </p>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>• New message notifications</li>
          <li>• Friend request alerts</li>
          <li>• Story reactions</li>
          <li>• Works even when app is closed!</li>
        </ul>
      </div>

      {permission === 'denied' && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800 font-semibold">
            ⚠️ Permission Blocked
          </p>
          <p className="text-sm text-red-700 mt-1">
            Please enable notifications in your browser settings to receive alerts.
          </p>
        </div>
      )}
    </div>
  );
};

export default PushNotificationSettings;
