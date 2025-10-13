// project\frontend\src\components\NotificationSystem.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

interface NotificationProps {
  isAuthenticated: boolean;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSystem: React.FC<NotificationProps> = ({ isAuthenticated }) => {
  const [socket, setSocket] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Set up socket connection when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Connect to the socket server
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error('API URL is not defined');
        return;
      }
      const socketInstance = io(apiUrl);
      setSocket(socketInstance);

      // Clean up socket connection when component unmounts
      return () => {
        if (socketInstance) {
          socketInstance.disconnect();
        }
      };
    }
  }, [isAuthenticated]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new order notifications
    socket.on('order:new', (order: any) => {
      const newNotification = {
        id: `order-${Date.now()}`,
        type: 'order',
        title: 'New Order Created',
        message: `Order #${order.orderNumber} has been created successfully.`,
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
        type: 'inventory',
        title: 'Low Stock Alert',
        message: `${productName} is now low in stock (${inventory.quantity} remaining).`,
        read: false,
        createdAt: new Date()
      };
      
      addNotification(newNotification);
      toast.warning(`Low stock alert: ${productName}`);
    });

    // Listen for customer notifications
    socket.on('customer:notification', (notification: any) => {
      const newNotification = {
        id: `customer-${Date.now()}`,
        type: 'customer',
        title: notification.title || 'Customer Notification',
        message: notification.message,
        read: false,
        createdAt: new Date()
      };
      
      addNotification(newNotification);
    });

    // Listen for sales team alerts
    socket.on('sales:newOrder', (order: any) => {
      const newNotification = {
        id: `sales-${Date.now()}`,
        type: 'sales',
        title: 'Sales Team Alert',
        message: `New order #${order.orderNumber} has been placed.`,
        read: false,
        createdAt: new Date()
      };
      
      addNotification(newNotification);
    });

    return () => {
      // Remove event listeners
      socket.off('order:new');
      socket.off('inventory:lowStock');
      socket.off('customer:notification');
      socket.off('sales:newOrder');
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

  // Toggle notification dropdown
  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };

  return (
    <>
      {/* Notification bell icon with badge */}
      <div className="relative">
        <button 
          onClick={toggleDropdown}
          className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <span className="sr-only">View notifications</span>
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          
          {/* Notification badge */}
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 px-2 py-1 text-xs font-bold rounded-full bg-red-500 text-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown menu */}
        {showDropdown && (
          <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1 divide-y divide-gray-100">
              <div className="px-4 py-3 flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No notifications
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer ${
                        notification.read ? 'bg-white' : 'bg-blue-50'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <p className="font-medium text-gray-900">{notification.title}</p>
                      <p className="text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast container for pop-up notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default NotificationSystem;