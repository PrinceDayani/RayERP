import { io } from '../server';
import { logger } from './logger';

export interface NotificationData {
  id?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'inventory' | 'project' | 'task' | 'budget' | 'system';
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  userId?: string;
  actionUrl?: string;
  metadata?: any;
}

export class NotificationEmitter {
  // Send notification to specific user
  static sendToUser(userId: string, notification: NotificationData) {
    const notificationWithId = {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...notification,
      priority: notification.priority || 'medium',
      timestamp: new Date(),
      userId
    };

    io.to(`user-${userId}`).emit('notification:received', notificationWithId);
    logger.info(`Notification sent to user ${userId}: ${notification.title}`);
  }

  // Send notification to all users
  static sendToAll(notification: NotificationData) {
    const notificationWithId = {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...notification,
      priority: notification.priority || 'medium',
      timestamp: new Date()
    };

    io.emit('notification:received', notificationWithId);
    logger.info(`Broadcast notification sent: ${notification.title}`);
  }

  // Send notification to users in a specific room
  static sendToRoom(room: string, notification: NotificationData) {
    const notificationWithId = {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...notification,
      priority: notification.priority || 'medium',
      timestamp: new Date()
    };

    io.to(room).emit('notification:received', notificationWithId);
    logger.info(`Notification sent to room ${room}: ${notification.title}`);
  }

  // Order-related notifications
  static orderCreated(order: any, userId?: string) {
    const notification: NotificationData = {
      type: 'order',
      title: 'New Order Created',
      message: `Order #${order.orderNumber} has been created successfully.`,
      priority: 'medium',
      actionUrl: `/dashboard/orders/${order._id}`,
      metadata: { orderId: order._id, orderNumber: order.orderNumber }
    };

    if (userId) {
      this.sendToUser(userId, notification);
    } else {
      this.sendToAll(notification);
    }
  }

  static orderUpdated(order: any, userId?: string) {
    const notification: NotificationData = {
      type: 'order',
      title: 'Order Updated',
      message: `Order #${order.orderNumber} status changed to ${order.status}.`,
      priority: 'medium',
      actionUrl: `/dashboard/orders/${order._id}`,
      metadata: { orderId: order._id, orderNumber: order.orderNumber, status: order.status }
    };

    if (userId) {
      this.sendToUser(userId, notification);
    } else {
      this.sendToAll(notification);
    }
  }

  // Inventory notifications
  static lowStockAlert(inventory: any) {
    const productName = inventory.productId?.name || 'Unknown product';
    const notification: NotificationData = {
      type: 'inventory',
      title: 'Low Stock Alert',
      message: `${productName} is running low (${inventory.quantity} remaining)`,
      priority: 'high',
      actionUrl: '/dashboard/inventory',
      metadata: { 
        productId: inventory.productId?._id, 
        quantity: inventory.quantity,
        productName 
      }
    };

    this.sendToAll(notification);
  }

  // Project notifications
  static projectUpdated(project: any, userId?: string) {
    const notification: NotificationData = {
      type: 'project',
      title: 'Project Updated',
      message: `Project "${project.name}" has been updated`,
      priority: 'medium',
      actionUrl: `/dashboard/projects/${project._id}`,
      metadata: { projectId: project._id, projectName: project.name }
    };

    if (userId) {
      this.sendToUser(userId, notification);
    } else {
      this.sendToAll(notification);
    }
  }

  // Task notifications
  static taskAssigned(task: any, userId: string) {
    const notification: NotificationData = {
      type: 'task',
      title: 'New Task Assigned',
      message: `You have been assigned: "${task.title}"`,
      priority: 'medium',
      actionUrl: `/dashboard/tasks/${task._id}`,
      metadata: { taskId: task._id, taskTitle: task.title }
    };

    this.sendToUser(userId, notification);
  }

  static taskDue(task: any, userId: string) {
    const notification: NotificationData = {
      type: 'task',
      title: 'Task Due Soon',
      message: `Task "${task.title}" is due soon`,
      priority: 'high',
      actionUrl: `/dashboard/tasks/${task._id}`,
      metadata: { taskId: task._id, taskTitle: task.title, dueDate: task.dueDate }
    };

    this.sendToUser(userId, notification);
  }

  // Budget notifications
  static budgetAlert(budget: any, message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'high') {
    const notification: NotificationData = {
      type: 'budget',
      title: 'Budget Alert',
      message,
      priority,
      actionUrl: '/dashboard/budgets',
      metadata: budget
    };

    this.sendToAll(notification);
  }

  // System notifications
  static systemAlert(title: string, message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') {
    const notification: NotificationData = {
      type: 'system',
      title,
      message,
      priority,
      metadata: { systemAlert: true }
    };

    this.sendToAll(notification);
  }

  // Security notifications
  static securityAlert(title: string, message: string, userId?: string) {
    const notification: NotificationData = {
      type: 'error',
      title,
      message,
      priority: 'urgent',
      metadata: { securityAlert: true }
    };

    if (userId) {
      this.sendToUser(userId, notification);
    } else {
      this.sendToAll(notification);
    }
  }
}

export default NotificationEmitter;