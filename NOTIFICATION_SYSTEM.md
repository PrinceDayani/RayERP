# Real-Time Notification System

## Overview

The RayERP system now includes a comprehensive real-time notification system with the following features:

- **Real-time notifications** via WebSocket connections
- **Persistent storage** in localStorage and MongoDB
- **Multiple notification types** (orders, inventory, projects, tasks, budgets, system alerts)
- **Priority levels** (low, medium, high, urgent)
- **Sound notifications** with user preferences
- **Browser push notifications** support
- **Auto-save settings** with real-time sync across devices
- **Test notification** functionality

## Components

### Frontend Components

1. **NotificationSystem** (`/components/NotificationSystem.tsx`)
   - Main notification bell icon with badge
   - Dropdown panel with notification list
   - Filter and management options
   - Real-time connection status

2. **NotificationSettings** (`/components/settings/NotificationSettings.tsx`)
   - Comprehensive notification preferences
   - Real-time settings with auto-save
   - Test notification functionality
   - Organized by categories (Core, Business, Reports, System)

3. **Settings Page** (`/app/dashboard/settings/page.tsx`)
   - Enhanced with real-time sync status
   - Connection monitoring
   - Manual sync functionality

### Hooks

1. **useNotifications** (`/hooks/useNotifications.ts`)
   - Centralized notification management
   - Real-time socket event handling
   - localStorage persistence
   - Sound and browser notification support

2. **useSocket** (`/hooks/useSocket.ts`)
   - WebSocket connection management
   - Auto-reconnection logic
   - Connection health monitoring

### Backend Components

1. **NotificationEmitter** (`/utils/notificationEmitter.ts`)
   - Utility class for sending notifications
   - Support for user-specific and broadcast notifications
   - Pre-built methods for common notification types

2. **Enhanced Server** (`/server.ts`)
   - Socket.IO event handlers
   - Real-time settings sync
   - Notification broadcasting

## Notification Types

### Business Notifications
- **Orders**: New orders, status updates, deliveries
- **Inventory**: Low stock alerts, inventory updates
- **Projects**: Project updates, milestone completions
- **Tasks**: Task assignments, due date reminders
- **Budgets**: Budget overruns, threshold alerts

### System Notifications
- **System Alerts**: Performance issues, errors
- **Security Alerts**: Login attempts, security events
- **Maintenance**: Scheduled maintenance, updates

### Report Notifications
- **Daily Reports**: Daily performance summaries
- **Weekly Reports**: Weekly analytics and insights
- **Monthly Reports**: Comprehensive monthly analysis

## Usage

### Frontend Usage

```typescript
// Using the notification hook
import { useNotifications } from '@/hooks/useNotifications';

const MyComponent = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    sendTestNotification
  } = useNotifications();

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      <button onClick={sendTestNotification}>
        Test Notification
      </button>
    </div>
  );
};
```

### Backend Usage

```typescript
// Using the notification emitter
import { NotificationEmitter } from '../utils/notificationEmitter';

// Send to specific user
NotificationEmitter.sendToUser('userId123', {
  type: 'info',
  title: 'Welcome!',
  message: 'Welcome to the system',
  priority: 'medium'
});

// Send to all users
NotificationEmitter.sendToAll({
  type: 'system',
  title: 'Maintenance Notice',
  message: 'System maintenance in 30 minutes',
  priority: 'high'
});

// Use pre-built methods
NotificationEmitter.orderCreated(orderData, userId);
NotificationEmitter.lowStockAlert(inventoryData);
NotificationEmitter.budgetAlert(budgetData, 'Budget exceeded!', 'urgent');
```

## Settings

### Core Settings
- **Email Notifications**: Receive notifications via email
- **Push Notifications**: Browser push notifications
- **Sound Notifications**: Play sound for new notifications

### Business Settings
- **Order Updates**: New orders, status changes
- **Inventory Alerts**: Low stock warnings
- **Project Updates**: Project milestones
- **Task Reminders**: Due dates and assignments
- **Budget Alerts**: Financial warnings

### Report Settings
- **Daily Reports**: Daily summaries
- **Weekly Reports**: Weekly analytics
- **Monthly Reports**: Monthly analysis

### System Settings
- **System Alerts**: Performance and errors
- **Security Alerts**: Security events
- **Maintenance Notices**: System updates

## Real-Time Features

### Auto-Save Settings
- Settings are automatically saved 500ms after changes
- Real-time sync across all user devices
- Visual feedback with save indicators

### Connection Monitoring
- Real-time connection status display
- Automatic reconnection on disconnect
- Offline mode support

### Cross-Device Sync
- Settings sync instantly across devices
- Notification state synchronization
- Real-time updates when settings change

## Testing

### Manual Testing
1. Open the Settings page
2. Navigate to Notifications tab
3. Click "Send Test Notification"
4. Check the notification bell for the test message

### Automated Testing
Run the test script:
```bash
node test-notifications.js
```

This will test all notification types and verify the system is working correctly.

## Browser Support

### Push Notifications
- Chrome 50+
- Firefox 44+
- Safari 16+
- Edge 79+

### WebSocket Support
- All modern browsers
- Fallback to polling for older browsers

## Security

### Input Validation
- All notification data is validated
- XSS protection for notification content
- Rate limiting for notification sending

### Authentication
- Socket connections require authentication
- User-specific notification rooms
- Secure token-based authentication

## Performance

### Optimization Features
- Maximum 100 notifications stored per user
- Efficient localStorage management
- Debounced settings saves
- Connection pooling for WebSockets

### Memory Management
- Automatic cleanup of old notifications
- Efficient event listener management
- Proper component unmounting

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check browser notification permissions
   - Verify WebSocket connection
   - Check console for errors

2. **Settings not saving**
   - Verify API connection
   - Check authentication token
   - Review network requests

3. **Sound not playing**
   - Check browser audio permissions
   - Verify sound file exists
   - Check user preferences

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'notifications');
```

## Future Enhancements

- Email notification templates
- SMS notification support
- Advanced filtering options
- Notification scheduling
- Analytics and reporting
- Mobile app push notifications