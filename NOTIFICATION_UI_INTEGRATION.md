# Notification UI - Integration Guide

## ✅ What Was Created

### 1. **NotificationCenter Component** 
`frontend/src/components/NotificationCenter.tsx`

**Features:**
- 🔔 Bell icon with unread count badge
- 📱 Slide-out panel (Sheet)
- ✅ Mark as read button
- 🗑️ Delete notification button
- ✓ Mark all as read
- 🧹 Clear all notifications
- 🎨 Priority-based colors
- 🔗 Clickable notifications (navigate to actionUrl)
- ⏰ Time ago display
- 📊 Empty state
- 🎯 Real-time updates via Socket.IO

### 2. **Sheet Component**
`frontend/src/components/ui/sheet.tsx`

Slide-out panel component for notifications.

## 🚀 How to Integrate

### Step 1: Install Required Package

```bash
cd frontend
npm install @radix-ui/react-dialog
```

### Step 2: Add to Your Layout/Header

**Option A: Add to Dashboard Header**

```tsx
// frontend/src/components/Dashboard/DashboardHeader.tsx
import { NotificationCenter } from '@/components/NotificationCenter';

export default function DashboardHeader() {
  return (
    <header className="flex items-center justify-between">
      <h1>Dashboard</h1>
      
      <div className="flex items-center gap-4">
        {/* Add Notification Center */}
        <NotificationCenter />
        
        {/* Other header items */}
        <UserMenu />
      </div>
    </header>
  );
}
```

**Option B: Add to Main Layout**

```tsx
// frontend/src/app/dashboard/layout.tsx
import { NotificationCenter } from '@/components/NotificationCenter';

export default function DashboardLayout({ children }) {
  return (
    <div>
      <nav className="flex items-center justify-between p-4">
        <Logo />
        <div className="flex items-center gap-4">
          <NotificationCenter />
          <UserMenu />
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
```

### Step 3: Verify Socket Connection

Make sure your app initializes the socket connection:

```tsx
// frontend/src/app/layout.tsx or dashboard/layout.tsx
import { useSocket } from '@/hooks/useSocket';

export default function Layout({ children }) {
  useSocket(); // Initialize socket connection
  
  return <>{children}</>;
}
```

## 🎨 Customization

### Change Colors

```tsx
// In NotificationCenter.tsx
const getPriorityColor = (priority: string) => {
  return {
    urgent: 'border-l-red-600 bg-red-100',
    high: 'border-l-orange-600 bg-orange-100',
    medium: 'border-l-blue-600 bg-blue-100',
    low: 'border-l-gray-600 bg-gray-100'
  }[priority];
};
```

### Change Icons

```tsx
const getNotificationIcon = (type: string) => {
  return {
    success: '🎉',
    error: '🚨',
    warning: '⚡',
    // ... customize as needed
  }[type];
};
```

### Change Position

```tsx
// Change from right to left
<SheetContent className="... inset-y-0 left-0 ...">
```

## 🧪 Testing

### 1. Send Test Notification

```bash
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer <your-token>"
```

### 2. Check UI

- Click bell icon in header
- Should see notification panel slide out
- Notification should appear with:
  - Icon
  - Title
  - Message
  - Time ago
  - Mark read button
  - Delete button

### 3. Test Actions

- ✅ Click "Mark as read" - notification should fade
- 🗑️ Click delete - notification should disappear
- ✓ Click "Mark all read" - all should fade
- 🧹 Click "Clear all" - all should disappear
- 🔔 Badge count should update

## 📱 Mobile Responsive

The NotificationCenter is fully responsive:
- Mobile: Full width panel
- Desktop: 400px width panel
- Touch-friendly buttons
- Smooth animations

## 🎯 Features Included

✅ Real-time notifications via Socket.IO  
✅ Unread count badge  
✅ Mark as read/unread  
✅ Delete notifications  
✅ Mark all as read  
✅ Clear all notifications  
✅ Priority-based styling  
✅ Time ago display  
✅ Clickable notifications  
✅ Empty state  
✅ Smooth animations  
✅ Mobile responsive  
✅ Dark mode support  
✅ Accessibility (ARIA labels)  

## 🔧 Troubleshooting

### Notifications Not Appearing?

1. Check Socket.IO connection:
```tsx
const socket = useSocket();
console.log('Socket connected:', socket?.connected);
```

2. Check browser console for errors

3. Verify backend is running:
```bash
curl http://localhost:5000/api/health
```

### Badge Not Updating?

Check `useNotifications` hook is properly initialized:
```tsx
const { unreadCount } = useNotifications();
console.log('Unread count:', unreadCount);
```

### Styling Issues?

Make sure Tailwind CSS is configured:
```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // ...
};
```

## 🎉 Done!

Your notification system is now fully functional with a beautiful UI!

**Test it:**
1. Login to dashboard
2. Look for bell icon in header
3. Click to open notification panel
4. Send test notification
5. Watch it appear in real-time! 🚀
