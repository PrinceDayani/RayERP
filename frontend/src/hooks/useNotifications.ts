"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useRealTimeSetting } from '@/lib/realTimeSettings';
import toast from 'react-hot-toast';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'inventory' | 'project' | 'task' | 'budget' | 'system';
  title: string;
  message: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  actionUrl?: string;
  metadata?: any;
}

export const useNotifications = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Settings
  const [soundEnabled] = useRealTimeSetting('soundEnabled', true);
  const [pushNotifications] = useRealTimeSetting('pushNotifications', true);
  const [emailNotifications] = useRealTimeSetting('emailNotifications', true);

  // Load notifications from server on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { notificationApi } = await import('@/lib/api/notifications');
        const response = await notificationApi.getAll({ limit: 100 });
        if (response.data.success) {
          const serverNotifications = response.data.data.map((n: any) => ({
            ...n,
            id: n._id,
            createdAt: new Date(n.createdAt)
          }));
          setNotifications(serverNotifications);
          setUnreadCount(response.data.unreadCount);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };
    loadNotifications();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNotificationReceived = (data: any) => {
      const notification: Notification = {
        id: data.id || `notif-${Date.now()}`,
        type: data.type || 'info',
        title: data.title,
        message: data.message,
        read: false,
        priority: data.priority || 'medium',
        createdAt: new Date(data.timestamp || new Date()),
        actionUrl: data.actionUrl,
        metadata: data.metadata
      };

      addNotification(notification);
    };

    socket.on('notification:received', handleNotificationReceived);
    socket.on('order:new', (order: any) => {
      handleNotificationReceived({
        type: 'order',
        title: 'New Order Created',
        message: `Order #${order.orderNumber} has been created`,
        priority: 'medium',
        actionUrl: `/dashboard/orders/${order._id}`,
        metadata: { orderId: order._id, orderNumber: order.orderNumber }
      });
    });

    socket.on('inventory:lowStock', (inventory: any) => {
      const productName = inventory.productId?.name || 'Unknown product';
      handleNotificationReceived({
        type: 'inventory',
        title: 'Low Stock Alert',
        message: `${productName} is running low (${inventory.quantity} remaining)`,
        priority: 'high',
        actionUrl: '/dashboard/inventory',
        metadata: { productId: inventory.productId?._id, quantity: inventory.quantity }
      });
    });

    socket.on('project:updated', (project: any) => {
      handleNotificationReceived({
        type: 'project',
        title: 'Project Updated',
        message: `Project "${project.name}" has been updated`,
        priority: 'medium',
        actionUrl: `/dashboard/projects/${project._id}`,
        metadata: { projectId: project._id, projectName: project.name }
      });
    });

    socket.on('task:assigned', (task: any) => {
      handleNotificationReceived({
        type: 'task',
        title: 'New Task Assigned',
        message: `You have been assigned: "${task.title}"`,
        priority: 'medium',
        actionUrl: `/dashboard/tasks/${task._id}`,
        metadata: { taskId: task._id, taskTitle: task.title }
      });
    });

    socket.on('budget:alert', (budget: any) => {
      handleNotificationReceived({
        type: 'budget',
        title: 'Budget Alert',
        message: budget.message || 'Budget threshold exceeded',
        priority: 'high',
        actionUrl: '/dashboard/budgets',
        metadata: budget
      });
    });

    socket.on('system:alert', (alert: any) => {
      handleNotificationReceived({
        type: 'system',
        title: alert.title || 'System Alert',
        message: alert.message,
        priority: alert.priority || 'medium',
        metadata: alert
      });
    });

    // Root user priority notifications
    socket.on('root:notification', (data: any) => {
      const notification: Notification = {
        id: data.id || `notif-${Date.now()}`,
        type: data.type || 'system',
        title: `🔴 ${data.title}`,
        message: data.message,
        read: false,
        priority: 'urgent',
        createdAt: new Date(data.timestamp || new Date()),
        actionUrl: data.actionUrl,
        metadata: data.metadata
      };
      addNotification(notification);
    });

    return () => {
      socket.off('notification:received', handleNotificationReceived);
      socket.off('order:new');
      socket.off('inventory:lowStock');
      socket.off('project:updated');
      socket.off('task:assigned');
      socket.off('budget:alert');
      socket.off('system:alert');
      socket.off('root:notification');
    };
  }, [socket, addNotification]);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => {
      const exists = prev.find(n => n.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev];
    });
    setUnreadCount(prev => prev + 1);

    // Play sound if enabled
    if (soundEnabled) {
      playNotificationSound();
    }

    // Show toast notification
    showToast(notification.type, notification.title);

    // Show browser notification if enabled
    if (pushNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  }, [soundEnabled, pushNotifications]);

  const playNotificationSound = useCallback(() => {
    try {
      // Try multiple audio formats for better compatibility
      const audioSources = ['/notification-sound.mp3', '/notification.wav', '/notification.ogg'];
      
      for (const src of audioSources) {
        try {
          const audio = new Audio(src);
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Silently fail if audio can't be played
          });
          break; // If successful, don't try other formats
        } catch (error) {
          continue; // Try next format
        }
      }
    } catch (error) {
      // Silently fail if audio can't be created
    }
  }, []);

  const showToast = useCallback((type: string, message: string) => {
    switch (type) {
      case 'success':
      case 'order':
        toast.success(message);
        break;
      case 'error':
      case 'system':
        toast.error(message);
        break;
      case 'warning':
      case 'inventory':
      case 'budget':
        toast.error(message); // Using error for warning as react-hot-toast doesn't have warning
        break;
      case 'info':
      case 'project':
      case 'task':
      default:
        toast(message);
        break;
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { notificationApi } = await import('@/lib/api/notifications');
      await notificationApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { notificationApi } = await import('@/lib/api/notifications');
      await notificationApi.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const { notificationApi } = await import('@/lib/api/notifications');
      await notificationApi.delete(id);
      setNotifications(prev => {
        const notification = prev.find(n => n.id === id);
        if (notification && !notification.read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n.id !== id);
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      const { notificationApi } = await import('@/lib/api/notifications');
      await notificationApi.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      const { notificationApi } = await import('@/lib/api/notifications');
      await notificationApi.sendTest();
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    }
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendTestNotification,
    addNotification
  };
};

export default useNotifications;