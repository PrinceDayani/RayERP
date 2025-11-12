# Project File Sharing Feature

## Overview
This feature allows users to share project files with specific departments, individual users, or both. Files can be uploaded to a project and then shared with granular control over who can access them.

## Features
- Upload files to projects
- Share files with entire departments
- Share files with specific users
- Share files with both departments and users simultaneously
- View all files shared with you
- Download shared files
- Track file sharing activity

## API Endpoints

### 1. Upload File to Project
**Endpoint:** `POST /api/projects/:id/files`

**Description:** Upload a file to a project with optional sharing settings.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Headers: Authorization: Bearer {token}

**Body Parameters:**
- `file` (required): The file to upload
- `sharedWithDepartments` (optional): JSON array of department IDs `["dept1", "dept2"]`
- `sharedWithUsers` (optional): JSON array of user IDs `["user1", "user2"]`
- `shareType` (optional): `"department"` | `"user"` | `"both"` (default: "department")

**Example:**
```javascript
const formData = new FormData();
formData.append('file', fileObject);
formData.append('sharedWithDepartments', JSON.stringify(['dept123', 'dept456']));
formData.append('sharedWithUsers', JSON.stringify(['user789']));
formData.append('shareType', 'both');

fetch('/api/projects/proj123/files', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
  body: formData
});
```

**Response:**
```json
{
  "_id": "file123",
  "name": "document-1234567890.pdf",
  "originalName": "report.pdf",
  "size": 102400,
  "mimeType": "application/pdf",
  "project": "proj123",
  "uploadedBy": {
    "_id": "user123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "sharedWithDepartments": [
    { "_id": "dept123", "name": "Engineering" }
  ],
  "sharedWithUsers": [
    { "_id": "user789", "name": "Jane Smith", "email": "jane@example.com" }
  ],
  "shareType": "both",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### 2. Update File Sharing Settings
**Endpoint:** `PUT /api/projects/:id/files/:fileId/share`

**Description:** Update who can access a specific file.

**Request:**
- Method: PUT
- Content-Type: application/json
- Headers: Authorization: Bearer {token}

**Body Parameters:**
- `departmentIds` (optional): Array of department IDs
- `userIds` (optional): Array of user IDs
- `shareType` (required): `"department"` | `"user"` | `"both"`

**Share Type Options:**
1. **"department"**: Share with entire departments
   - All members of specified departments can access
   - Requires `departmentIds` array

2. **"user"**: Share with specific individuals
   - Only specified users can access
   - Requires `userIds` array

3. **"both"**: Share with departments AND specific users
   - Combines both sharing methods
   - Requires both `departmentIds` and `userIds` arrays

**Examples:**

**Share with entire department:**
```json
{
  "shareType": "department",
  "departmentIds": ["dept123", "dept456"]
}
```

**Share with specific users:**
```json
{
  "shareType": "user",
  "userIds": ["user123", "user456", "user789"]
}
```

**Share with both departments and specific users:**
```json
{
  "shareType": "both",
  "departmentIds": ["dept123"],
  "userIds": ["user456", "user789"]
}
```

**Response:**
```json
{
  "_id": "file123",
  "originalName": "report.pdf",
  "sharedWithDepartments": [
    { "_id": "dept123", "name": "Engineering" }
  ],
  "sharedWithUsers": [
    { "_id": "user456", "name": "Alice Johnson", "email": "alice@example.com" },
    { "_id": "user789", "name": "Bob Wilson", "email": "bob@example.com" }
  ],
  "shareType": "both",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

---

### 3. Get Project Files
**Endpoint:** `GET /api/projects/:id/files`

**Description:** Get all files for a specific project.

**Request:**
- Method: GET
- Headers: Authorization: Bearer {token}

**Response:**
```json
[
  {
    "_id": "file123",
    "name": "document-1234567890.pdf",
    "originalName": "report.pdf",
    "size": 102400,
    "mimeType": "application/pdf",
    "project": "proj123",
    "uploadedBy": {
      "_id": "user123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "sharedWithDepartments": [
      { "_id": "dept123", "name": "Engineering" }
    ],
    "sharedWithUsers": [
      { "_id": "user789", "name": "Jane Smith", "email": "jane@example.com" }
    ],
    "shareType": "both",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### 4. Get Shared Files
**Endpoint:** `GET /api/projects/shared/files`

**Description:** Get all files shared with the current user (either directly or through their department).

**Request:**
- Method: GET
- Headers: Authorization: Bearer {token}
- Query Parameters:
  - `departmentId` (optional): Filter by specific department

**Response:**
```json
[
  {
    "_id": "file123",
    "originalName": "report.pdf",
    "size": 102400,
    "mimeType": "application/pdf",
    "project": {
      "_id": "proj123",
      "name": "Q1 Marketing Campaign"
    },
    "uploadedBy": {
      "_id": "user123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "sharedWithDepartments": [
      { "_id": "dept123", "name": "Engineering" }
    ],
    "sharedWithUsers": [
      { "_id": "user789", "name": "Jane Smith", "email": "jane@example.com" }
    ],
    "shareType": "both",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### 5. Download File
**Endpoint:** `GET /api/projects/:id/files/:fileId/download`

**Description:** Download a specific file.

**Request:**
- Method: GET
- Headers: Authorization: Bearer {token}

**Response:** File download (binary data)

---

### 6. Delete File
**Endpoint:** `DELETE /api/projects/:id/files/:fileId`

**Description:** Delete a file from the project.

**Request:**
- Method: DELETE
- Headers: Authorization: Bearer {token}

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

---

## Usage Examples

### Frontend Implementation

#### Upload File with Sharing
```javascript
async function uploadFileToProject(projectId, file, shareSettings) {
  const formData = new FormData();
  formData.append('file', file);
  
  if (shareSettings.departments?.length) {
    formData.append('sharedWithDepartments', JSON.stringify(shareSettings.departments));
  }
  
  if (shareSettings.users?.length) {
    formData.append('sharedWithUsers', JSON.stringify(shareSettings.users));
  }
  
  formData.append('shareType', shareSettings.type); // 'department', 'user', or 'both'
  
  const response = await fetch(`/api/projects/${projectId}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
}

// Example usage
const shareSettings = {
  type: 'both',
  departments: ['dept123', 'dept456'],
  users: ['user789']
};

await uploadFileToProject('proj123', fileObject, shareSettings);
```

#### Update File Sharing
```javascript
async function updateFileSharing(projectId, fileId, shareSettings) {
  const response = await fetch(`/api/projects/${projectId}/files/${fileId}/share`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      shareType: shareSettings.type,
      departmentIds: shareSettings.departments,
      userIds: shareSettings.users
    })
  });
  
  return response.json();
}

// Share with specific users only
await updateFileSharing('proj123', 'file123', {
  type: 'user',
  users: ['user456', 'user789']
});
```

#### Get Files Shared With Me
```javascript
async function getMySharedFiles(departmentId = null) {
  const url = departmentId 
    ? `/api/projects/shared/files?departmentId=${departmentId}`
    : '/api/projects/shared/files';
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
}
```

---

## Database Schema

### ProjectFile Model
```typescript
{
  name: String,                          // Generated filename
  originalName: String,                  // Original filename
  path: String,                          // File path
  size: Number,                          // File size in bytes
  mimeType: String,                      // MIME type
  project: ObjectId,                     // Reference to Project
  uploadedBy: ObjectId,                  // Reference to User
  sharedWithDepartments: [ObjectId],     // Array of Department IDs
  sharedWithUsers: [ObjectId],           // Array of User IDs
  shareType: String,                     // 'department' | 'user' | 'both'
  fileData: Buffer,                      // File binary data
  storageType: String,                   // 'disk' | 'database'
  compressed: Boolean,                   // Is file compressed
  originalSize: Number,                  // Original file size
  createdAt: Date,
  updatedAt: Date
}
```

---

## Access Control

### Who Can Upload Files?
- Users with project access (project members, managers, or owners)

### Who Can Share Files?
- Users with project access can update sharing settings for files

### Who Can View Files?
- Users explicitly shared via `sharedWithUsers`
- Users in departments shared via `sharedWithDepartments`
- Project members with appropriate access

### Who Can Delete Files?
- File uploader
- Project managers
- Users with appropriate permissions

---

## Best Practices

1. **Granular Sharing**: Use specific user sharing for sensitive documents
2. **Department Sharing**: Use department sharing for team-wide documents
3. **Combined Sharing**: Use 'both' type when you need department-wide access plus specific individuals from other departments
4. **File Size**: Keep files under 50MB for optimal performance
5. **Activity Logging**: All file operations are logged for audit trails

---

## Security Features

- JWT authentication required for all endpoints
- Project access validation
- File data excluded from list responses (only metadata)
- Activity logging for all file operations
- File compression and optimization
- Secure file storage in database

---

## Error Handling

### Common Error Responses

**401 Unauthorized**
```json
{
  "message": "Authentication required"
}
```

**404 Not Found**
```json
{
  "message": "File not found"
}
```

**400 Bad Request**
```json
{
  "message": "No file uploaded"
}
```

**500 Internal Server Error**
```json
{
  "message": "Internal server error"
}
```

---

## Migration Notes

Existing files will have:
- `sharedWithUsers`: Empty array
- `shareType`: 'department' (default)

No data migration required - the feature is backward compatible.
