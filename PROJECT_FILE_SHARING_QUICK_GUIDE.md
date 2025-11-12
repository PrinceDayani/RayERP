# Project File Sharing - Quick Reference Guide

## 🎯 Overview
Share project files with departments, specific users, or both. Three sharing modes available:
- **Department**: Share with all members of selected departments
- **User**: Share with specific individuals only
- **Both**: Combine department-wide and individual sharing

---

## 🚀 Quick Start

### Upload & Share File
```bash
curl -X POST http://localhost:5000/api/projects/{projectId}/files \
  -H "Authorization: Bearer {token}" \
  -F "file=@document.pdf" \
  -F "shareType=both" \
  -F 'sharedWithDepartments=["dept123","dept456"]' \
  -F 'sharedWithUsers=["user789"]'
```

### Update Sharing Settings
```bash
curl -X PUT http://localhost:5000/api/projects/{projectId}/files/{fileId}/share \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "shareType": "user",
    "userIds": ["user123", "user456"]
  }'
```

### Get Files Shared With Me
```bash
curl -X GET http://localhost:5000/api/projects/shared/files \
  -H "Authorization: Bearer {token}"
```

---

## 📋 Share Type Options

| Share Type | Description | Required Fields |
|------------|-------------|-----------------|
| `department` | Share with entire departments | `departmentIds` array |
| `user` | Share with specific users only | `userIds` array |
| `both` | Share with departments AND users | Both `departmentIds` and `userIds` |

---

## 💡 Common Use Cases

### 1. Share with Engineering Department
```json
{
  "shareType": "department",
  "departmentIds": ["engineering_dept_id"]
}
```

### 2. Share with Specific Team Members
```json
{
  "shareType": "user",
  "userIds": ["user1", "user2", "user3"]
}
```

### 3. Share with Department + External Stakeholder
```json
{
  "shareType": "both",
  "departmentIds": ["marketing_dept_id"],
  "userIds": ["external_consultant_id"]
}
```

### 4. Share with Multiple Departments
```json
{
  "shareType": "department",
  "departmentIds": ["engineering_id", "design_id", "qa_id"]
}
```

---

## 🔑 Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/projects/:id/files` | Upload file with sharing |
| PUT | `/projects/:id/files/:fileId/share` | Update sharing settings |
| GET | `/projects/:id/files` | List project files |
| GET | `/projects/shared/files` | Files shared with me |
| GET | `/projects/:id/files/:fileId/download` | Download file |
| DELETE | `/projects/:id/files/:fileId` | Delete file |

---

## 🎨 Frontend Example (React)

```typescript
// Upload file with sharing
const uploadFile = async (projectId, file, shareSettings) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('shareType', shareSettings.type);
  
  if (shareSettings.departments) {
    formData.append('sharedWithDepartments', 
      JSON.stringify(shareSettings.departments));
  }
  
  if (shareSettings.users) {
    formData.append('sharedWithUsers', 
      JSON.stringify(shareSettings.users));
  }
  
  const response = await fetch(`/api/projects/${projectId}/files`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  return response.json();
};

// Usage
await uploadFile('proj123', fileObject, {
  type: 'both',
  departments: ['dept1', 'dept2'],
  users: ['user1']
});
```

---

## ✅ Best Practices

1. **Sensitive Documents**: Use `shareType: "user"` for confidential files
2. **Team Documents**: Use `shareType: "department"` for team-wide access
3. **Mixed Access**: Use `shareType: "both"` when you need department + specific external users
4. **File Size**: Keep files under 50MB for optimal performance
5. **Naming**: Use descriptive file names for easy identification

---

## 🔒 Security Notes

- All endpoints require JWT authentication
- Project access is validated before file operations
- File data is stored compressed in database
- All operations are logged for audit trails
- Users can only access files shared with them or their department

---

## 📊 Response Structure

```typescript
interface ProjectFile {
  _id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  sharedWithDepartments: Array<{
    _id: string;
    name: string;
  }>;
  sharedWithUsers: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  shareType: 'department' | 'user' | 'both';
  createdAt: string;
  updatedAt: string;
}
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| File not uploading | Check file size (max 50MB) and type |
| Can't see shared file | Verify you're in the shared department or user list |
| Update sharing fails | Ensure you have project access |
| Download fails | Check file exists and you have access |

---

## 📞 Support

For detailed documentation, see [PROJECT_FILE_SHARING.md](PROJECT_FILE_SHARING.md)

For frontend examples, see [FRONTEND_FILE_SHARING_EXAMPLE.tsx](FRONTEND_FILE_SHARING_EXAMPLE.tsx)
