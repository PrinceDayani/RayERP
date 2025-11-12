# Database File Storage

## Overview
Files are now stored directly in MongoDB database as binary data (Buffer), enabling access from any device remotely without relying on local disk storage.

## Benefits
✅ **Remote Access** - Access files from any device/location
✅ **Cloud Ready** - Works seamlessly with MongoDB Atlas
✅ **No Disk Dependencies** - Files stored in database, not filesystem
✅ **Backup Included** - Files backed up with database backups
✅ **Scalable** - Works across multiple servers/containers

## How It Works

### Upload Process
1. File uploaded via multipart/form-data
2. Temporarily saved to disk by multer
3. File read into Buffer
4. Stored in MongoDB as binary data
5. Temporary disk file deleted
6. Only metadata returned to client

### Download Process
1. Client requests file by ID
2. Server retrieves file from database
3. Binary data sent with proper headers
4. Browser handles download/preview

### Storage Fields
```typescript
{
  fileData: Buffer,           // Binary file content
  storageType: 'database',    // Storage location
  mimeType: string,           // For proper content-type
  originalName: string,       // For download filename
  size: number               // File size in bytes
}
```

## Performance Considerations

### Optimizations Applied
- ✅ `fileData` excluded from list queries (`.select('-fileData')`)
- ✅ Only fetched when downloading/previewing
- ✅ Proper indexing on project and uploadedBy fields
- ✅ Temporary files cleaned up immediately

### Recommended Limits
- Max file size: 50MB (configurable in multer)
- For files >16MB: Consider GridFS (MongoDB's file storage system)
- Current setup: Suitable for documents, images, PDFs

## Migration from Disk Storage

### Backward Compatibility
The system supports both storage types:
- `storageType: 'database'` - New files (stored in DB)
- `storageType: 'disk'` - Legacy files (stored on filesystem)

### Download Logic
```javascript
if (file.storageType === 'database' && file.fileData) {
  // Serve from database
  res.send(file.fileData);
} else if (fs.existsSync(file.path)) {
  // Serve from disk (legacy)
  res.download(file.path);
}
```

## MongoDB Configuration

### For Large Files (Optional)
If you need to store files >16MB, use GridFS:

```javascript
import { GridFSBucket } from 'mongodb';

const bucket = new GridFSBucket(db, {
  bucketName: 'projectFiles'
});
```

### Current Setup
- Uses standard MongoDB documents
- Suitable for files up to 16MB
- For larger files, document size limit applies

## Environment Setup

### MongoDB Atlas (Recommended)
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/erp-system
```

### Local MongoDB
```env
MONGO_URI=mongodb://localhost:27017/erp-system
```

## API Endpoints (Unchanged)

### Upload File
```
POST /api/projects/:id/files
Content-Type: multipart/form-data
Body: file (binary)
```

### Download File
```
GET /api/projects/:id/files/:fileId/download
Response: Binary file data
```

### List Files
```
GET /api/projects/:id/files
Response: Array of file metadata (without binary data)
```

## Testing

### Upload Test
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  http://localhost:5000/api/projects/PROJECT_ID/files
```

### Download Test
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/projects/PROJECT_ID/files/FILE_ID/download \
  --output downloaded_file.pdf
```

## Troubleshooting

### Issue: "File too large"
**Solution**: Increase multer limit in `projectFileController.ts`:
```javascript
limits: {
  fileSize: 100 * 1024 * 1024 // 100MB
}
```

### Issue: "Out of memory"
**Solution**: For very large files, implement GridFS or external storage (S3, Azure Blob)

### Issue: Slow queries
**Solution**: Ensure indexes are created:
```javascript
ProjectFileSchema.index({ project: 1 });
ProjectFileSchema.index({ uploadedBy: 1 });
```

## Future Enhancements

- [ ] GridFS integration for files >16MB
- [ ] AWS S3 / Azure Blob storage option
- [ ] File compression before storage
- [ ] Thumbnail generation for images
- [ ] Virus scanning on upload
- [ ] File versioning

## Security Notes

✅ Authentication required for all operations
✅ Project access control enforced
✅ File type validation on upload
✅ Size limits enforced
✅ Binary data excluded from list responses

---

**Files are now accessible from anywhere! 🌍**
