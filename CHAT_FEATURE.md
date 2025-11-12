# 💬 Chat Feature Documentation

## Overview
A real-time chat system integrated into RayERP for seamless team communication.

## ✨ Features

### Real-time Messaging
- **Instant message delivery** via WebSocket
- **Typing indicators** to show when users are typing
- **Read receipts** to track message status
- **Message timestamps** with smart formatting

### User Interface
- **Modern chat interface** with beautiful gradients
- **Responsive design** for mobile and desktop
- **Dark mode support** for comfortable viewing
- **Avatar system** with user initials
- **Search functionality** to find conversations quickly

### Chat Management
- **One-on-one conversations** with team members
- **User list** to start new conversations
- **Message history** with persistent storage
- **Auto-scroll** to latest messages
- **Real-time updates** across all devices

## 🚀 Getting Started

### Backend Setup

1. **Models Created**:
   - `Chat.ts` - Stores conversations and messages
   - Supports text, file, and image messages
   - Tracks read status and timestamps

2. **API Endpoints**:
   ```
   GET    /api/chat/chats              - Get all user chats
   POST   /api/chat/chats              - Create/get chat with user
   POST   /api/chat/chats/message      - Send a message
   GET    /api/chat/chats/:id/messages - Get chat messages
   PUT    /api/chat/chats/:id/read     - Mark messages as read
   GET    /api/chat/users              - Get available users
   ```

3. **Socket Events**:
   - `join_chat` - Join a chat room
   - `leave_chat` - Leave a chat room
   - `typing` - Broadcast typing status
   - `stop_typing` - Stop typing broadcast
   - `new_message` - Receive new messages

### Frontend Components

1. **ChatInterface** - Main chat container
2. **ChatSidebar** - Conversation list with search
3. **ChatWindow** - Message display and input
4. **NewChatDialog** - Start new conversations

### Access the Chat

1. Navigate to **Dashboard → Chat** in the sidebar
2. Click the **"+"** button to start a new conversation
3. Select a user from the list
4. Start messaging!

## 🎨 UI Features

### Chat Sidebar
- Search conversations by name
- View last message preview
- See relative timestamps ("2 hours ago")
- Refresh button to reload chats
- New chat button

### Chat Window
- Beautiful message bubbles
- User avatars with gradient backgrounds
- Timestamp for each message
- Typing indicator
- Smooth auto-scroll
- Enter key to send messages

### Message Display
- **Own messages**: Blue gradient on the right
- **Other messages**: White/dark card on the left
- **Avatars**: Colorful gradient backgrounds
- **Timestamps**: Smart formatting (time or date)

## 🔧 Technical Details

### Database Schema
```typescript
Chat {
  participants: [User IDs]
  messages: [{
    sender: User ID
    content: String
    timestamp: Date
    read: Boolean
    type: 'text' | 'file' | 'image'
    fileUrl?: String
  }]
  lastMessage: String
  lastMessageTime: Date
  isGroup: Boolean
  groupName?: String
  groupAdmin?: User ID
}
```

### Real-time Communication
- Uses Socket.IO for instant messaging
- Automatic reconnection on disconnect
- Room-based message delivery
- Typing indicators with debouncing

### State Management
- React hooks for local state
- Socket events for real-time updates
- Optimistic UI updates
- Automatic message refresh

## 📱 Responsive Design

- **Desktop**: Full sidebar + chat window
- **Mobile**: Collapsible sidebar with overlay
- **Tablet**: Adaptive layout
- **All devices**: Touch-friendly interface

## 🎯 Future Enhancements

- [ ] Group chat support
- [ ] File and image sharing
- [ ] Message reactions (emoji)
- [ ] Message editing and deletion
- [ ] Voice messages
- [ ] Video calls
- [ ] Message search
- [ ] Chat notifications
- [ ] Unread message counter
- [ ] Online/offline status
- [ ] Message forwarding
- [ ] Chat archiving

## 🔐 Security

- **Authentication required** for all chat endpoints
- **User verification** before message access
- **Participant validation** for message sending
- **JWT-based** socket authentication

## 🐛 Troubleshooting

### Messages not appearing?
- Check WebSocket connection in browser console
- Verify backend server is running
- Ensure JWT token is valid

### Can't see other users?
- Verify user has proper permissions
- Check if users are in the database
- Refresh the user list

### Typing indicator not working?
- Check socket connection
- Verify socket events are being emitted
- Check browser console for errors

## 📚 API Examples

### Start a new chat
```javascript
POST /api/chat/chats
{
  "participantId": "user_id_here"
}
```

### Send a message
```javascript
POST /api/chat/chats/message
{
  "chatId": "chat_id_here",
  "content": "Hello, world!",
  "type": "text"
}
```

### Get messages
```javascript
GET /api/chat/chats/:chatId/messages
```

## 🎉 Enjoy Chatting!

The chat feature is now fully integrated into RayERP. Start communicating with your team in real-time!

---

**Built with ❤️ for seamless team collaboration**
