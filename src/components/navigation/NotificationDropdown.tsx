'use client';

import React from 'react';
import { Bell, Dot, MessageSquare, Heart, Users } from 'lucide-react';
import { useNotifications } from '@/lib/notifications';

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: {
    restaurantId?: string;
    messageId?: string;
    url?: string;
    [key: string]: unknown;
  };
  createdAt: string;
}

export default function NotificationDropdown() {
  const { notifications, permission, requestPermission, clearNotifications, isSupported } = useNotifications();
  const [isOpen, setIsOpen] = React.useState(false);
  const [hasNewNotifications, setHasNewNotifications] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Handle clicking outside to close
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark as having new notifications when they arrive
  React.useEffect(() => {
    if (notifications.length > 0 && !isOpen) {
      setHasNewNotifications(true);
    }
  }, [notifications, isOpen]);

  // Clear new notification indicator when opened
  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewNotifications(false);
    }
  };

  // Request permission on first click if needed
  const handleBellClick = async () => {
    if (isSupported && permission === 'default') {
      await requestPermission();
    }
    handleOpen();
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={16} className="text-orange-500" />;
      case 'favorite':
        return <Heart size={16} className="text-red-500" />;
      case 'follow':
        return <Users size={16} className="text-blue-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Handle notification click
  const handleNotificationClick = (notification: AppNotification) => {
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-700" />
        {/* Red dot for new notifications */}
        {(hasNewNotifications || notifications.length > 0) && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <Dot size={8} className="text-white" />
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="text-sm text-orange-500 hover:text-orange-600"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Permission notice */}
          {isSupported && permission === 'default' && (
            <div className="p-4 border-b border-gray-200 bg-orange-50">
              <p className="text-sm text-gray-700 mb-2">
                Enable notifications to stay updated!
              </p>
              <button
                onClick={requestPermission}
                className="text-sm bg-orange-500 text-white px-3 py-1 rounded-md hover:bg-orange-600"
              >
                Enable Notifications
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="flex items-start gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* New indicator */}
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 5 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button className="text-sm text-orange-500 hover:text-orange-600">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Instagram-like popup notification */}
      {notifications.length > 0 && !isOpen && (
        <div className="fixed top-20 right-4 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-slide-in-right">
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0">
              {getNotificationIcon(notifications[0].type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 line-clamp-1">
                {notifications[0].title}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                {notifications[0].message}
              </p>
            </div>
            <button
              onClick={() => setHasNewNotifications(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
