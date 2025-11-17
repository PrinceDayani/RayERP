# File Sharing Implementation Guide

## Quick Start

### Backend Setup (Already Complete ✅)

The following files have been created:

1. **Model**: `backend/src/models/FileShare.ts`
2. **Controller**: `backend/src/controllers/fileShareController.ts`
3. **Routes**: `backend/src/routes/fileShare.routes.ts`
4. **Routes Integration**: Updated `backend/src/routes/index.ts`

### Frontend Components (Ready to Use)

1. **FileShareDialog.tsx** - Dialog for sharing files
2. **SharedFilesPanel.tsx** - Panel showing files shared with user
3. **fileShareApi.ts** - API utility functions

## Integration Steps

### Step 1: Add Share Button to Project Files

In your project files list component, add a share button:

```tsx
import FileShareDialog from '@/components/FileShareDialog';
import { fileShareApi } from '@/lib/fileShareApi';

// In your component
const [shareDialogOpen, setShareDialogOpen] = useState(false);
const [selectedFile, setSelectedFile] = useState(null);

const handleShare = async (fileId, employeeIds, message) => {
  await fileShareApi.shareFile(fileId, employeeIds, message);
  // Show success message
};

// In your file list
<button onClick={() => {
  setSelectedFile(file);
  setShareDialogOpen(true);
}}>
  Share
</button>

{shareDialogOpen && (
  <FileShareDialog
    fileId={selectedFile._id}
    fileName={selectedFile.originalName}
    employees={allEmployees}
    onShare={handleShare}
    onClose={() => setShareDialogOpen(false)}
  />
)}
```

### Step 2: Add Shared Files Section to Dashboard

```tsx
import SharedFilesPanel from '@/components/SharedFilesPanel';

// In your dashboard
<SharedFilesPanel />
```

### Step 3: Add Project File Shares View

In your project details page, show all file shares:

```tsx
import ProjectFileShares from '@/components/ProjectFileShares';

// In your project page
<ProjectFileShares projectId={projectId} />
```

### Step 4: Add File Share Tracking

In your file details view, show who has access:

```tsx
import { fileShareApi } from '@/lib/fileShareApi';

const [shares, setShares] = useState([]);

useEffect(() => {
  const loadShares = async () => {
    const data = await fileShareApi.getFileShares(fileId);
    setShares(data);
  };
  loadShares();
}, [fileId]);

// Display shares
{shares.map(share => (
  <div key={share._id}>
    <p>Shared with: {share.sharedWith.map(e => e.firstName).join(', ')}</p>
    <p>Status: {share.status}</p>
    {share.viewedBy.length > 0 && (
      <p>Viewed by: {share.viewedBy.map(v => v.employee.firstName).join(', ')}</p>
    )}
  </div>
))}
```

## API Usage Examples

### Share a File
```javascript
await fileShareApi.shareFile(
  'fileId123',
  ['employeeId1', 'employeeId2'],
  'Please review this document'
);
```

### Get My Shared Files
```javascript
const sharedFiles = await fileShareApi.getSharedFiles();
```

### Mark as Viewed
```javascript
await fileShareApi.markAsViewed('shareId123');
```

### Mark as Downloaded
```javascript
await fileShareApi.markAsDownloaded('shareId123');
```

### Get Project Shares
```javascript
const projectShares = await fileShareApi.getProjectShares('projectId123');
```

### Get File Shares
```javascript
const shares = await fileShareApi.getFileShares('fileId123');
```

### Delete Share
```javascript
await fileShareApi.deleteShare('shareId123');
```

## Database Migration

No migration needed! The FileShare collection will be created automatically when the first share is created.

## Testing the Feature

### 1. Start the Backend
```bash
cd backend
npm run dev
```

### 2. Test with Postman/Thunder Client

**Share a File:**
```
POST http://localhost:5000/api/file-shares/files/{fileId}/share
Headers: Authorization: Bearer {token}
Body: {
  "employeeIds": ["employeeId1", "employeeId2"],
  "message": "Please review"
}
```

**Get Shared Files:**
```
GET http://localhost:5000/api/file-shares/shared
Headers: Authorization: Bearer {token}
```

### 3. Test Frontend
```bash
cd frontend
npm run dev
```

Navigate to:
- Project files page → Click share button
- Dashboard → View shared files section

## User Flow

### Sharing Flow
1. User uploads file to project (existing feature)
2. User clicks "Share" button on file
3. Dialog opens with employee list
4. User selects employees and adds optional message
5. User clicks "Share File"
6. Recipients see file in their "Shared Files" section

### Receiving Flow
1. Employee logs in
2. Sees notification badge on "Shared Files"
3. Opens shared files panel
4. Sees list of files shared with them
5. Can mark as viewed or download
6. Status updates automatically

## Security Notes

✅ Only authenticated users can share files
✅ Only project members can share project files
✅ Only recipients can view/download shared files
✅ Only sender can delete shares
✅ All actions are logged with timestamps

## Performance Tips

- Use pagination for large share lists
- Cache employee lists for share dialog
- Implement real-time updates with WebSocket
- Add search/filter for shared files

## Future Enhancements

- [ ] Email notifications on share
- [ ] Real-time notifications
- [ ] Share with departments/teams
- [ ] Share expiration dates
- [ ] Download limits
- [ ] File version tracking
- [ ] Share analytics dashboard
- [ ] Bulk share operations

## Troubleshooting

### Issue: "Employee not found"
**Solution**: Ensure the user has an associated employee record

### Issue: "File not found"
**Solution**: Verify the file exists and belongs to a project

### Issue: "Not authorized"
**Solution**: Check if user is a member of the project

### Issue: Share not appearing
**Solution**: Check if employee ID is correct and employee is active

## Support

For issues or questions:
1. Check the API documentation in FILE_SHARING_SYSTEM.md
2. Review the code comments in the controller files
3. Test endpoints with Postman
4. Check server logs for errors

---

**Ready to use! 🚀**
