# File Sharing System

## Overview
The File Sharing System allows team members to share project files with specific employees within the organization. Files uploaded to a project remain in the project, but can be shared with any employee for viewing or downloading.

## Features
- ✅ Share project files with specific employees
- ✅ Track file views and downloads
- ✅ View all files shared with you
- ✅ See who has viewed/downloaded shared files
- ✅ Add optional messages when sharing
- ✅ Delete shares (by sender only)

## API Endpoints

### Base URL
`http://localhost:5000/api/file-shares`

### 1. Share a File
**POST** `/files/:fileId/share`

Share a project file with one or more employees.

**Request Body:**
```json
{
  "employeeIds": ["employeeId1", "employeeId2"],
  "message": "Please review this document"
}
```

**Response:**
```json
{
  "_id": "shareId",
  "file": {
    "name": "document.pdf",
    "originalName": "Project Document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf"
  },
  "project": "projectId",
  "sharedBy": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "sharedWith": [
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    }
  ],
  "message": "Please review this document",
  "status": "pending",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### 2. Get Files Shared With Me
**GET** `/shared`

Get all files that have been shared with the current employee.

**Response:**
```json
[
  {
    "_id": "shareId",
    "file": {
      "name": "document.pdf",
      "originalName": "Project Document.pdf"
    },
    "project": {
      "name": "Website Redesign"
    },
    "sharedBy": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "message": "Please review",
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

### 3. Get All Shares for a Project
**GET** `/projects/:projectId/shares`

Get all file shares within a specific project.

**Response:**
```json
[
  {
    "_id": "shareId",
    "file": {
      "name": "document.pdf",
      "originalName": "Project Document.pdf"
    },
    "sharedBy": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "sharedWith": [
      {
        "firstName": "Jane",
        "lastName": "Smith"
      }
    ],
    "status": "viewed",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

### 4. Get All Shares for a File
**GET** `/files/:fileId/shares`

Get all sharing records for a specific file (who it was shared with, views, downloads).

**Response:**
```json
[
  {
    "_id": "shareId",
    "sharedBy": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "sharedWith": [
      {
        "firstName": "Jane",
        "lastName": "Smith"
      }
    ],
    "viewedBy": [
      {
        "employee": {
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "viewedAt": "2024-01-15T11:00:00Z"
      }
    ],
    "downloadedBy": [],
    "status": "viewed",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

### 5. Mark File as Viewed
**PATCH** `/shares/:shareId/viewed`

Mark a shared file as viewed by the current employee.

**Response:**
```json
{
  "_id": "shareId",
  "status": "viewed",
  "viewedBy": [
    {
      "employee": "employeeId",
      "viewedAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

### 6. Mark File as Downloaded
**PATCH** `/shares/:shareId/downloaded`

Mark a shared file as downloaded by the current employee.

**Response:**
```json
{
  "_id": "shareId",
  "status": "downloaded",
  "downloadedBy": [
    {
      "employee": "employeeId",
      "downloadedAt": "2024-01-15T11:30:00Z"
    }
  ]
}
```

### 7. Delete a Share
**DELETE** `/shares/:shareId`

Delete a file share (only the person who shared can delete).

**Response:**
```json
{
  "message": "Share deleted successfully"
}
```

## Usage Flow

### Sharing a File
1. Upload file to project (existing functionality)
2. Get the file ID from the project files list
3. Call share endpoint with employee IDs
4. Recipients receive notification (if notification system is integrated)

### Viewing Shared Files
1. Employee calls GET `/shared` to see all files shared with them
2. Click on a file to view details
3. System automatically marks as viewed
4. Download if needed (marks as downloaded)

### Tracking File Shares
1. Project manager/team lead views file details
2. Calls GET `/files/:fileId/shares` to see all shares
3. View who has seen/downloaded the file
4. Track engagement with shared files

## Database Schema

### FileShare Model
```typescript
{
  file: ObjectId (ref: ProjectFile),
  project: ObjectId (ref: Project),
  sharedBy: ObjectId (ref: Employee),
  sharedWith: [ObjectId] (ref: Employee),
  message: String (optional),
  status: 'pending' | 'viewed' | 'downloaded',
  viewedBy: [{
    employee: ObjectId,
    viewedAt: Date
  }],
  downloadedBy: [{
    employee: ObjectId,
    downloadedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## Security & Permissions
- Only authenticated users can share files
- Only employees assigned to the project can share files
- Recipients must be valid employees in the organization
- Only the sender can delete a share
- Only recipients can mark files as viewed/downloaded

## Integration Points

### With Existing Systems
- **Project Files**: Uses existing ProjectFile model
- **Employee Management**: Links to Employee records
- **Authentication**: Uses existing JWT authentication
- **Project Access**: Respects project access controls

### Future Enhancements
- Email notifications when files are shared
- Real-time notifications via WebSocket
- Bulk sharing to departments/teams
- Share expiration dates
- Download limits
- File version tracking in shares

## Example Usage

### Share a file with team members
```javascript
// Frontend example
const shareFile = async (fileId, employeeIds, message) => {
  const response = await fetch(`/api/file-shares/files/${fileId}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ employeeIds, message })
  });
  return response.json();
};

// Usage
await shareFile('file123', ['emp1', 'emp2'], 'Please review by EOD');
```

### Get my shared files
```javascript
const getMySharedFiles = async () => {
  const response = await fetch('/api/file-shares/shared', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### Get all shares in a project
```javascript
const getProjectShares = async (projectId) => {
  const response = await fetch(`/api/file-shares/projects/${projectId}/shares`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## Testing

### Test Scenarios
1. ✅ Share file with single employee
2. ✅ Share file with multiple employees
3. ✅ View shared files list
4. ✅ Mark file as viewed
5. ✅ Mark file as downloaded
6. ✅ Track multiple views/downloads
7. ✅ Delete share by sender
8. ✅ Prevent unauthorized deletion
9. ✅ Validate employee IDs
10. ✅ Handle non-existent files

## Error Handling

### Common Errors
- `404`: File not found
- `404`: Employee not found
- `400`: Invalid employee IDs
- `403`: Not authorized to share/delete
- `403`: Not authorized to view file
- `500`: Server error

## Performance Considerations
- Indexed queries on file, project, and employee references
- Efficient population of related documents
- Pagination recommended for large share lists
- Caching for frequently accessed shares

---

**Built with ❤️ for RayERP**
