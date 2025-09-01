'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageSquare, Heart, Star, Trash2, Check, CheckCheck } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

export default function NotificationsPage() {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'messages'>('all');

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5 text-orange-500" />;
      case 'favorite':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'review':
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    const data = notification.data || {};
    
    switch (notification.type) {
      case 'message':
        return data.restaurantId ? `/restaurant/${data.restaurantId}` : '#';
      case 'review_response':
        return data.reviewId ? `/reviews/${data.reviewId}` : '/reviews/history';
      case 'favorite_update':
        return data.restaurantId ? `/restaurant/${data.restaurantId}` : '/favorites';
      default:
        return '#';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="h-24 bg-gray-200"></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with your latest activities</p>
          </div>
          
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead}
              className="aharamm-gradient text-white hover:opacity-90"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'aharamm-gradient text-white' : 'border-orange-200 text-gray-700 hover:bg-orange-50'}
          >
            All Notifications
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
            className={filter === 'unread' ? 'aharamm-gradient text-white' : 'border-orange-200 text-gray-700 hover:bg-orange-50'}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === 'messages' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('messages')}
            className={filter === 'messages' ? 'aharamm-gradient text-white' : 'border-orange-200 text-gray-700 hover:bg-orange-50'}
          >
            Messages
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="text-center py-12 border-orange-200">
              <CardContent>
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                <p className="text-gray-500">When you get notifications, they&rsquo;ll show up here.</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`border-l-4 transition-all hover:shadow-md ${
                  notification.isRead 
                    ? 'border-l-gray-300 bg-white' 
                    : 'border-l-orange-500 bg-orange-50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Icon */}
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <Badge className="bg-orange-500 text-white text-xs">New</Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                          {notification.expiresAt && (
                            <span>
                              Expires: {new Date(notification.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {getNotificationLink(notification) !== '#' && (
                        <Link href={getNotificationLink(notification)}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-orange-200 text-orange-600 hover:bg-orange-50"
                            onClick={() => {
                              if (!notification.isRead) {
                                markAsRead(notification.id);
                              }
                            }}
                          >
                            View
                          </Button>
                        </Link>
                      )}
                      
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                          className="text-orange-600 hover:bg-orange-50"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load More Button (for pagination if needed) */}
        {notifications.length > 0 && notifications.length % 20 === 0 && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              className="border-orange-200 text-gray-700 hover:bg-orange-50"
            >
              Load More Notifications
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
