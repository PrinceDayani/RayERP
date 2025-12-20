# Customer Account Creation Notification System

## ✅ Production-Ready Implementation

### Overview
Automatic notification system that alerts users when a contact is marked as a customer and a ledger account is automatically created.

---

## 🔧 Backend Implementation

### 1. **Contact Controller** (`backend/src/controllers/contactController.ts`)

#### Features Implemented:
- ✅ Auto-create Chart of Account when `isCustomer: true`
- ✅ Link account to contact via `ledgerAccountId`
- ✅ Create database notification
- ✅ Emit real-time Socket.IO notification
- ✅ Works for both CREATE and UPDATE operations

#### Code Flow:

**When Creating New Contact:**
```typescript
if (isCustomer) {
  // 1. Create ledger account
  const accountId = await createCustomerLedgerAccount(
    savedContact._id.toString(), 
    savedContact.name, 
    userId
  );
  
  // 2. Link to contact
  savedContact.ledgerAccountId = accountId;
  await savedContact.save();
  
  // 3. Create notification in database
  const notification = await Notification.create({
    userId,
    type: 'success',
    title: 'Customer Account Created',
    message: `Customer "${savedContact.name}" has been created with ledger account.`,
    priority: 'medium',
    actionUrl: `/dashboard/contacts/${savedContact._id}`,
    metadata: { contactId: savedContact._id, accountId }
  });
  
  // 4. Emit real-time notification
  if (global.io) {
    global.io.to(userId).emit('notification:new', notification);
  }
}
```

**When Updating Existing Contact:**
```typescript
if (sanitizedData.isCustomer && !updatedContact.ledgerAccountId) {
  // Same flow as above
}
```

---

## 🎨 Frontend Implementation

### 2. **Notification Hook** (`frontend/src/hooks/useNotifications.ts`)

#### Features:
- ✅ Real-time Socket.IO listener for `notification:new` event
- ✅ Automatic toast notification display
- ✅ Sound notification (if enabled)
- ✅ Browser push notification (if enabled)
- ✅ Persistent notification storage

#### Socket Listeners:
```typescript
socket.on('notification:new', handleNotificationReceived);
socket.on('notification:received', handleNotificationReceived);
```

### 3. **Notification Center** (`frontend/src/components/NotificationCenter.tsx`)

#### Features:
- ✅ Bell icon with unread count badge
- ✅ Slide-out panel with all notifications
- ✅ Click notification to navigate to contact
- ✅ Mark as read / Mark all as read
- ✅ Delete individual / Clear all
- ✅ Priority-based color coding
- ✅ Time ago display

---

## 📊 Notification Details

### Notification Object:
```typescript
{
  userId: string,              // User who will receive notification
  type: 'success',             // Notification type
  title: 'Customer Account Created',
  message: 'Customer "John Doe" has been created with ledger account.',
  priority: 'medium',          // low | medium | high | urgent
  actionUrl: '/dashboard/contacts/[id]',  // Click to navigate
  metadata: {
    contactId: string,
    accountId: string
  }
}
```

### Visual Indicators:
- 🔔 **Bell Icon**: Shows unread count badge
- ✅ **Success Icon**: Green checkmark for customer creation
- 🔵 **Priority Color**: Blue border for medium priority
- ⏰ **Timestamp**: "2m ago", "1h ago", etc.
- 🔗 **Clickable**: Navigate to contact details

---

## 🚀 User Experience Flow

### Scenario 1: Creating New Customer Contact
1. User creates contact with `isCustomer: true`
2. Backend creates Chart of Account automatically
3. Backend saves notification to database
4. Backend emits Socket.IO event to user
5. Frontend receives event instantly
6. Toast notification appears: "Customer Account Created"
7. Bell icon badge increments
8. Sound plays (if enabled)
9. Browser notification shows (if enabled)
10. User clicks bell → sees notification
11. User clicks notification → navigates to contact

### Scenario 2: Updating Contact to Customer
1. User edits existing contact
2. User checks "Is Customer" checkbox
3. Same flow as Scenario 1

---

## 🔐 Security & Permissions

- ✅ Notifications are user-specific (sent to `userId`)
- ✅ Socket.IO rooms ensure privacy
- ✅ Only creator can update contact
- ✅ Visibility levels respected (universal/departmental/personal)

---

## 📱 Multi-Channel Notifications

### 1. **Real-Time (Socket.IO)**
- Instant delivery
- No page refresh needed
- Works across all open tabs

### 2. **Toast Notification**
- Immediate visual feedback
- Auto-dismisses after 3-5 seconds
- Non-intrusive

### 3. **Notification Center**
- Persistent storage
- Accessible anytime via bell icon
- Organized by priority and time

### 4. **Browser Push** (Optional)
- Works even when tab is inactive
- Requires user permission
- Can be disabled in settings

### 5. **Sound Alert** (Optional)
- Audio feedback
- Can be disabled in settings
- Multiple format support (mp3/wav/ogg)

---

## 🧪 Testing

### Manual Test:
1. Login to RayERP
2. Navigate to Contacts
3. Create new contact with "Is Customer" checked
4. Observe:
   - Toast notification appears
   - Bell icon badge increments
   - Sound plays (if enabled)
   - Click bell to see notification
   - Click notification to navigate to contact

### API Test:
```bash
# Create customer contact
curl -X POST http://localhost:5000/api/contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "phone": "1234567890",
    "email": "test@example.com",
    "isCustomer": true,
    "visibilityLevel": "personal"
  }'
```

---

## 📋 Database Schema

### Notification Model:
```typescript
{
  userId: ObjectId,           // ref: User
  type: String,               // enum: success, error, warning, info, etc.
  title: String,
  message: String,
  read: Boolean,              // default: false
  priority: String,           // enum: low, medium, high, urgent
  actionUrl: String,          // optional
  metadata: Mixed,            // optional
  createdAt: Date,
  readAt: Date                // optional
}
```

### Contact Model (Updated):
```typescript
{
  // ... existing fields
  isCustomer: Boolean,        // default: false
  ledgerAccountId: ObjectId   // ref: ChartOfAccount, optional
}
```

---

## 🎯 Key Features

✅ **Automatic Account Creation**: No manual steps required
✅ **Real-Time Notifications**: Instant feedback via Socket.IO
✅ **Multi-Channel Delivery**: Toast + Bell + Browser + Sound
✅ **Persistent Storage**: Notifications saved in database
✅ **Clickable Actions**: Navigate directly to contact
✅ **Priority System**: Visual indicators for importance
✅ **User Preferences**: Sound and push can be disabled
✅ **Error Handling**: Graceful fallback if account creation fails
✅ **Logging**: All actions logged for debugging
✅ **Production Ready**: Tested and optimized

---

## 🔄 Real-Time Architecture

```
User Action (Create/Update Contact with isCustomer=true)
    ↓
Backend Controller
    ↓
Create Ledger Account (ChartOfAccount)
    ↓
Link Account to Contact (ledgerAccountId)
    ↓
Save Notification to Database
    ↓
Emit Socket.IO Event → global.io.to(userId).emit('notification:new')
    ↓
Frontend Socket Listener (useNotifications hook)
    ↓
Add to Notification State
    ↓
Show Toast Notification
    ↓
Play Sound (if enabled)
    ↓
Show Browser Notification (if enabled)
    ↓
Update Bell Icon Badge
    ↓
User Clicks Bell → Opens Notification Center
    ↓
User Clicks Notification → Navigate to Contact
```

---

## 📝 Configuration

### Backend Environment:
```env
# Socket.IO is already configured in server.ts
# No additional configuration needed
```

### Frontend Settings:
Users can configure in Settings → Notifications:
- ✅ Enable/Disable Sound
- ✅ Enable/Disable Browser Push
- ✅ Enable/Disable Email Notifications

---

## 🐛 Troubleshooting

### Notification Not Appearing:
1. Check Socket.IO connection (green indicator in UI)
2. Verify user is authenticated
3. Check browser console for errors
4. Ensure notification permissions granted

### Sound Not Playing:
1. Check browser autoplay policy
2. Verify sound file exists in `/public`
3. Check user settings (sound enabled?)
4. Try user interaction first (click something)

### Bell Icon Not Updating:
1. Check Socket.IO connection
2. Verify `notification:new` event is emitted
3. Check React state updates
4. Refresh page to reload notifications

---

## ✨ Future Enhancements

- [ ] Email notifications for offline users
- [ ] SMS notifications for urgent alerts
- [ ] Notification grouping (multiple similar notifications)
- [ ] Notification scheduling (send later)
- [ ] Rich notifications with images/buttons
- [ ] Notification templates
- [ ] Bulk notification management
- [ ] Notification analytics dashboard

---

## 📚 Related Files

### Backend:
- `backend/src/controllers/contactController.ts` - Main logic
- `backend/src/utils/customerLedger.ts` - Account creation
- `backend/src/models/Notification.ts` - Notification schema
- `backend/src/models/Contact.ts` - Contact schema
- `backend/src/routes/notification.routes.ts` - API routes

### Frontend:
- `frontend/src/hooks/useNotifications.ts` - Notification hook
- `frontend/src/components/NotificationCenter.tsx` - UI component
- `frontend/src/lib/api/notifications.ts` - API client
- `frontend/src/contexts/socket/useNotifications.ts` - Socket context

---

## 🎉 Status: PRODUCTION READY ✅

All features implemented, tested, and ready for deployment!
