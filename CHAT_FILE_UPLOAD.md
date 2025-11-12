# Chat File Upload Feature

## Overview
Added support for sending images and documents in chat conversations between users.

## Features

### Supported File Types
- **Images**: JPEG, JPG, PNG, GIF
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP, RAR

### File Size Limit
- Maximum file size: 10MB per file

### Functionality
- Upload files via paperclip button
- Preview selected files before sending
- Add optional captions to files
- View images inline in chat
- Download documents via click
- Real-time file sharing via WebSocket

## Backend Implementation

### New Endpoint
```
POST /api/chats/upload
```
- Accepts multipart/form-data
- Returns file URL and type
- Requires authentication

### File Storage
- Files stored in: `backend/uploads/chat/`
- Naming format: `chat-{timestamp}-{random}.{ext}`
- Served statically via `/uploads` route

### Updated Chat Model
```typescript
type: 'text' | 'file' | 'image'
fileUrl?: string
```

### Controller Updates
- `uploadFile`: Handles file upload
- `sendMessage`: Enhanced with real-time socket emission

## Frontend Implementation

### ChatWindow Component
- File selection button (paperclip icon)
- File preview with remove option
- Image/document icons based on type
- Inline image display
- Document download links
- Upload progress indicator

### Message Display
- **Images**: Displayed inline, clickable to open in new tab
- **Documents**: Shown with file icon and name, clickable to download
- **Captions**: Optional text with files

## Usage

### Sending Files
1. Click paperclip button in chat input
2. Select image or document
3. (Optional) Add caption
4. Click send button

### Viewing Files
- **Images**: Click to view full size in new tab
- **Documents**: Click filename to download

## Security
- File type validation on upload
- Size limit enforcement (10MB)
- Authentication required
- Participant verification

## Real-time Updates
- Socket.IO integration for instant file sharing
- Automatic chat list refresh on new files
- Typing indicators maintained during upload

## API Examples

### Upload File
```javascript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/chats/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Send Message with File
```javascript
await chatAPI.sendMessage(
  chatId, 
  'Check this out!', 
  'image', 
  '/uploads/chat/chat-123456.jpg'
);
```

## File Structure
```
backend/
├── uploads/
│   └── chat/              # Chat file storage
├── src/
│   ├── controllers/
│   │   └── chatController.ts  # Added uploadFile method
│   └── routes/
│       └── chat.routes.ts     # Added upload endpoint
frontend/
└── src/
    └── components/
        └── chat/
            └── ChatWindow.tsx  # Enhanced with file upload UI
```

## Testing

### Test File Upload
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Login and navigate to chat
4. Click paperclip icon
5. Select an image or document
6. Add optional caption
7. Send and verify file appears in chat

### Verify File Access
1. Check file saved in `backend/uploads/chat/`
2. Access via browser: `http://localhost:5000/uploads/chat/{filename}`
3. Verify inline display for images
4. Verify download for documents

## Notes
- Files persist on server filesystem
- No automatic cleanup implemented
- Consider cloud storage (S3) for production
- Root users can view but not send files
- Socket rooms use chatId for real-time updates
