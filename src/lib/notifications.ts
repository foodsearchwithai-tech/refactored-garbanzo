
'use client';

import React from 'react';

// Notification types
interface NotificationData {
  restaurantId?: string;
  messageId?: string;
  url?: string;
  [key: string]: unknown;
}

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: NotificationData;
  createdAt: string;
}

interface BrowserNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: NotificationData;
  requireInteraction?: boolean;
}

// Real-time notification service
class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';
  private subscribers: Set<(notification: AppNotification) => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.permission = Notification.permission;
      this.setupMessageListener();
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request notification permission from user
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Show browser notification
  showNotification(title: string, options: BrowserNotificationOptions = {}) {
    if (typeof window === 'undefined' || this.permission !== 'granted') {
      return null;
    }

    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction || false,
      ...options
    });

    // Auto close after 5 seconds if not requiring interaction
    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    return notification;
  }

  // Show in-app notification popup (like Instagram)
  showInAppNotification(notification: AppNotification) {
    // Notify all subscribers (components that are listening)
    this.subscribers.forEach(callback => {
      callback(notification);
    });

    // Also show browser notification if permission granted
    this.showNotification(notification.title, {
      body: notification.message,
      tag: notification.id,
      data: notification.data,
      requireInteraction: notification.type === 'message'
    });
  }

  // Subscribe to real-time notifications
  subscribe(callback: (notification: AppNotification) => void) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Setup polling for new notifications
  private setupMessageListener() {
    // Poll for new notifications every 10 seconds
    setInterval(() => {
      this.checkForNewNotifications();
    }, 10000);
  }

  // Check for new notifications
  private async checkForNewNotifications() {
    try {
      const response = await fetch('/api/notifications/recent');
      if (response.ok) {
        const data = await response.json();
        if (data.notifications && data.notifications.length > 0) {
          data.notifications.forEach((notification: AppNotification) => {
            this.showInAppNotification(notification);
          });
        }
      }
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  }

  // Get current permission status
  getPermission(): NotificationPermission {
    return this.permission;
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
}

export const notificationService = NotificationService.getInstance();

// Hook for using notifications in React components
export function useNotifications() {
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [permission, setPermission] = React.useState<NotificationPermission>('default');

  React.useEffect(() => {
    // Get initial permission status
    setPermission(notificationService.getPermission());

    // Subscribe to new notifications
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 recent
    });

    return unsubscribe;
  }, []);

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermission(notificationService.getPermission());
    return granted;
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    permission,
    requestPermission,
    clearNotifications,
    isSupported: notificationService.isSupported()
  };
}
