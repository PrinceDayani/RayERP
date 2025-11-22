'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Settings, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealTimeSetting } from '@/lib/realTimeSettings';
import toast from 'react-hot-toast';

interface NotificationProps {
  isAuthenticated: boolean;
}

const NotificationSystem: React.FC<NotificationProps> = ({ isAuthenticated }) => {
  const socket = useSocket();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendTestNotification
  } = useNotifications();
  
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('all');
  const [isConnected, setIsConnected] = useState(false);

  // Real-time settings
  const [pushNotifications] = useRealTimeSetting('pushNotifications', true);

  // Socket connection status
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleConnect = () => {
      setIsConnected(true);
      console.log('✅ Notification system connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('⚠️ Notification system disconnected');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'order': return '📦';
      case 'inventory': return '📊';
      case 'project': return '🏗️';
      case 'task': return '✅';
      case 'budget': return '💰';
      case 'system': return '⚙️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-200';
      case 'high': return 'bg-orange-100 border-orange-200';
      case 'medium': return 'bg-blue-100 border-blue-200';
      case 'low': return 'bg-gray-100 border-gray-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Browser notifications enabled!');
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Bell className={`h-5 w-5 ${isConnected ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`} />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {!isConnected && (
          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </Button>

      {showDropdown && (
        <Card className="absolute right-0 mt-2 w-96 max-w-sm shadow-lg border z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {!isConnected && (
                  <Badge variant="outline" className="text-xs">
                    Offline
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {pushNotifications && 'Notification' in window && Notification.permission === 'default' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={requestNotificationPermission}
                    className="text-xs"
                  >
                    Enable Browser Notifications
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDropdown(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Filter buttons */}
            <div className="flex gap-1 mt-2">
              {['all', 'unread', 'order', 'inventory', 'project', 'task'].map((filterType) => (
                <Button
                  key={`filter-${filterType}`}
                  variant={filter === filterType ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                  className="text-xs capitalize"
                >
                  {filterType}
                </Button>
              ))}
            </div>
          </CardHeader>
          
          <Separator />
          
          <CardContent className="p-0">
            {/* Action buttons */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={sendTestNotification}
                className="text-xs"
              >
                <Bell className="h-3 w-3 mr-1" />
                Send Test
              </Button>
            </div>
            
            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <div 
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                      } ${getPriorityColor(notification.priority)}`}
                      onClick={() => {
                        markAsRead(notification.id);
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl;
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                            <p className="font-medium text-sm truncate">{notification.title}</p>
                            {notification.priority === 'urgent' && (
                              <Badge variant="destructive" className="text-xs">Urgent</Badge>
                            )}
                            {notification.priority === 'high' && (
                              <Badge variant="secondary" className="text-xs">High</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {index < filteredNotifications.length - 1 && <Separator />}
                  </React.Fragment>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationSystem;