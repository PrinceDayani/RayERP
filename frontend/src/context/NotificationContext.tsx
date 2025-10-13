// project\frontend\src\contexts\NotificationContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Setup socket connection
  useEffect(() => {
    // Check if user is authenticated by looking for token
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!process.env.NEXT_PUBLIC_API_URL) {
      throw new Error('NEXT_PUBLIC_API_URL environment variable is not configured');
    }
    
    // Connect to socket server
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL);
    setSocket(socketInstance);

    // Cleanup function
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new order notifications
    socket.on('order:new', (order: any) => {
      const newNotification = {
        id: `order-${Date.now()}`,
        type: 'order',
        title: 'New Order Created',
        message: `Order #${order.orderNumber} has been created.`,
        read: false,
        createdAt: new Date()
      };
      
      addNotification(newNotification);
      toast.success(`Order #${order.orderNumber} created successfully`);
    });

    // Listen for inventory low stock alerts
    socket.on('inventory:lowStock', (inventory: any) => {
      const productName = inventory.productId?.name || 'Unknown product';
      
      const newNotification = {
        id: `inventory-${Date.now()}`,
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${productName} is now low in stock (${inventory.quantity} remaining).`,
        read: false,
        createdAt: new Date()
      };
      
      addNotification(newNotification);
      toast.warning(`Low stock alert: ${productName}`);
    });

    // Listen for dashboard refresh
    socket.on('dashboard:refresh', () => {
      const newNotification = {
        id: `dashboard-${Date.now()}`,
        type: 'info',
        title: 'Dashboard Updated',
        message: 'Dashboard data has been refreshed with new information.',
        read: false,
        createdAt: new Date()
      };
      
      addNotification(newNotification);
    });

    // Additional socket listeners can be added here for other notification types

    return () => {
      // Clean up all socket listeners
      socket.off('order:new');
      socket.off('inventory:lowStock');
      socket.off('dashboard:refresh');
    };
  }, [socket]);

  // Add a new notification
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Load notifications from localStorage on initial render
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
      } catch (error) {
        console.error('Failed to parse saved notifications', error);
      }
    }
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
