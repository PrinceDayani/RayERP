'use client';

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import toast from 'react-hot-toast';

export default function RealTimeNotifications() {
  const socket = useSocket();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!socket) return;

    // Real-time notification handlers
    const handlers = {
      'notification:received': (data: any) => {
        addNotification({
          id: data.id || `notif-${Date.now()}`,
          type: data.type || 'info',
          title: data.title,
          message: data.message,
          read: false,
          priority: data.priority || 'medium',
          createdAt: new Date(data.timestamp || Date.now()),
          actionUrl: data.actionUrl,
          metadata: data.metadata
        });
      },

      'order:new': (order: any) => {
        toast.success(`New order #${order.orderNumber} created`);
      },

      'order:updated': (order: any) => {
        toast(`Order #${order.orderNumber} updated to ${order.status}`);
      },

      'inventory:lowStock': (inventory: any) => {
        const productName = inventory.productId?.name || 'Product';
        toast.error(`Low stock: ${productName} (${inventory.quantity} left)`);
      },

      'project:updated': (project: any) => {
        toast(`Project "${project.name}" updated`);
      },

      'task:assigned': (task: any) => {
        toast.success(`New task assigned: "${task.title}"`);
      },

      'budget:alert': (budget: any) => {
        toast.error(budget.message || 'Budget alert');
      },

      'system:alert': (alert: any) => {
        toast(alert.message, { icon: '⚙️' });
      }
    };

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Cleanup
    return () => {
      Object.keys(handlers).forEach(event => {
        socket.off(event);
      });
    };
  }, [socket, addNotification]);

  return null; // This is a headless component
}
