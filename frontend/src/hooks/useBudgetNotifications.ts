import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface BudgetNotification {
  id: string;
  type: 'approval_request' | 'approval_granted' | 'approval_rejected' | 'budget_updated' | 'workflow_completed';
  budgetId: string;
  budgetName: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export const useBudgetNotifications = () => {
  const [notifications, setNotifications] = useState<BudgetNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Simulate real-time notifications (in production, this would use WebSocket/Socket.IO)
  const addNotification = useCallback((notification: Omit<BudgetNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: BudgetNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    const toastVariant = notification.priority === 'high' ? 'destructive' : 'default';
    toast({
      title: getNotificationTitle(notification.type),
      description: notification.message,
      variant: toastVariant,
    });
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Simulate connection status
  useEffect(() => {
    setIsConnected(true);
    
    // Simulate periodic notifications for demo
    const interval = setInterval(() => {
      if (Math.random() > 0.95) { // 5% chance every 5 seconds
        const mockNotifications = [
          {
            type: 'approval_request' as const,
            budgetId: 'budget_' + Date.now(),
            budgetName: 'Q4 Marketing Budget',
            message: 'New budget approval request requires your attention',
            priority: 'high' as const,
            actionUrl: '/dashboard/budgets/approvals'
          },
          {
            type: 'approval_granted' as const,
            budgetId: 'budget_' + Date.now(),
            budgetName: 'IT Infrastructure Budget',
            message: 'Budget has been approved and is now active',
            priority: 'medium' as const,
            actionUrl: '/dashboard/budgets'
          },
          {
            type: 'budget_updated' as const,
            budgetId: 'budget_' + Date.now(),
            budgetName: 'Operations Budget',
            message: 'Budget allocation has been updated',
            priority: 'low' as const,
            actionUrl: '/dashboard/budgets'
          }
        ];
        
        const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
        addNotification(randomNotification);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    isConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
};

const getNotificationTitle = (type: BudgetNotification['type']): string => {
  switch (type) {
    case 'approval_request':
      return 'Approval Required';
    case 'approval_granted':
      return 'Budget Approved';
    case 'approval_rejected':
      return 'Budget Rejected';
    case 'budget_updated':
      return 'Budget Updated';
    case 'workflow_completed':
      return 'Workflow Complete';
    default:
      return 'Budget Notification';
  }
};

export default useBudgetNotifications;