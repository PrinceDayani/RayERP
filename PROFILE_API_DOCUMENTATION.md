# Profile API Documentation

## Overview
Complete API documentation for user profile management in RayERP system.

## Base URL
```
http://localhost:5000/api/users
```

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Get Current User Profile (Basic)
Get basic profile information for the authenticated user.

**Endpoint:** `GET /api/users/profile`  
**Alternative:** `GET /api/users/me`  
**Auth Required:** Yes

**Response:**
```json
{
  "_id": "user_id",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "role": "employee",
  "department": "Engineering",
  "avatarUrl": "/uploads/avatars/avatar-123456.jpg",
  "name": "John Doe",
  "status": "active"
}
```

---

### 2. Get Complete Profile
Get comprehensive profile including employee data and assigned projects.

**Endpoint:** `GET /api/users/profile/complete`  
**Auth Required:** Yes

**Response:**
```json
{
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": {
      "_id": "role_id",
      "name": "employee",
      "description": "Employee with basic access",
      "permissions": ["view_employees", "view_products"]
    },
    "status": "active"
  },
  "employee": {
    "_id": "employee_id",
    "employeeId": "EMP001",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "department": "Engineering",
    "position": "Software Engineer",
    "hireDate": "2023-01-15T00:00:00.000Z",
    "status": "active",
    "skills": ["JavaScript", "React", "Node.js"],
    "avatarUrl": "/uploads/avatars/avatar-123456.jpg",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  },
  "projects": [
    {
      "_id": "project_id",
      "name": "Project Alpha",
      "description": "Main project description",
      "status": "in_progress",
      "priority": "high",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-12-31T00:00:00.000Z",
      "progress": 65
    }
  ]
}
```

---

### 3. Update Profile
Update current user's profile information.

**Endpoint:** `PUT /api/users/profile`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "skills": ["JavaScript", "React", "Node.js", "TypeScript"],
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": {
      "_id": "role_id",
      "name": "employee"
    },
    "status": "active"
  }
}
```

---

### 4. Upload Avatar
Upload profile picture for the authenticated user.

**Endpoint:** `POST /api/users/profile/avatar`  
**Auth Required:** Yes  
**Content-Type:** `multipart/form-data`

**Request:**
- Form field name: `avatar`
- Accepted formats: JPEG, JPG, PNG, GIF, WEBP
- Max file size: 5MB

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);

const response = await fetch('http://localhost:5000/api/users/profile/avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "avatarUrl": "/uploads/avatars/avatar-1234567890-123456789.jpg"
}
```

---

### 5. Change Password
Change password for the authenticated user.

**Endpoint:** `PUT /api/users/change-password`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Validation:**
- Current password must be correct
- New password must be at least 6 characters

**Response (Success):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response (Error - Wrong Current Password):**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

## Admin Endpoints

### 6. Get All Users
Get list of all users (Admin/SuperAdmin only).

**Endpoint:** `GET /api/users`  
**Auth Required:** Yes (Admin/SuperAdmin)

**Response:**
```json
[
  {
    "id": "user_id",
    "_id": "user_id",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "role": {
      "_id": "role_id",
      "name": "employee"
    },
    "department": "Engineering",
    "avatarUrl": "/uploads/avatars/avatar-123456.jpg",
    "status": "active",
    "lastLogin": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### 7. Get User by ID
Get specific user details by ID (Admin/SuperAdmin only).

**Endpoint:** `GET /api/users/:id`  
**Auth Required:** Yes (Admin/SuperAdmin)

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": {
      "_id": "role_id",
      "name": "employee"
    },
    "status": "active"
  }
}
```

---

### 8. Update User Role
Update role for a specific user (SuperAdmin only).

**Endpoint:** `PUT /api/users/:id/role`  
**Auth Required:** Yes (SuperAdmin/Root)

**Request Body:**
```json
{
  "roleId": "new_role_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": {
      "_id": "new_role_id",
      "name": "manager"
    }
  }
}
```

---

### 9. Reset User Password
Reset password for a specific user (SuperAdmin only).

**Endpoint:** `PUT /api/users/:id/reset-password`  
**Auth Required:** Yes (SuperAdmin/Root)

**Request Body:**
```json
{
  "newPassword": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### 10. Bulk Update User Roles
Update roles for multiple users at once (SuperAdmin only).

**Endpoint:** `PUT /api/users/bulk/role`  
**Auth Required:** Yes (SuperAdmin/Root)

**Request Body:**
```json
{
  "userIds": ["user_id_1", "user_id_2", "user_id_3"],
  "roleId": "new_role_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully updated 3 user(s)",
  "updated": 3
}
```

---

### 11. Delete User
Delete a specific user (SuperAdmin only).

**Endpoint:** `DELETE /api/users/:id`  
**Auth Required:** Yes (SuperAdmin/Root)

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error message describing the issue"
}
```

---

## Frontend Integration Examples

### React/Next.js Example - Get Complete Profile
```typescript
const fetchProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/users/profile/complete', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Profile:', data);
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
  }
};
```

### React/Next.js Example - Update Profile
```typescript
const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Profile updated:', data);
    }
  } catch (error) {
    console.error('Error updating profile:', error);
  }
};
```

### React/Next.js Example - Upload Avatar
```typescript
const uploadAvatar = async (file: File) => {
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch('http://localhost:5000/api/users/profile/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Avatar uploaded:', data.avatarUrl);
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
  }
};
```

---

## Notes

1. **Avatar Storage**: Avatars are stored in `/uploads/avatars/` directory on the server
2. **Avatar URL**: The returned `avatarUrl` is a relative path. Prepend with API base URL for full URL
3. **Role Hierarchy**: Users cannot modify users with equal or higher role levels
4. **Root User**: The Root user cannot be modified or deleted
5. **Password Security**: Passwords are hashed using bcrypt before storage
6. **Token Expiry**: JWT tokens expire based on `JWT_EXPIRES_IN` environment variable

---

## Security Considerations

1. Always use HTTPS in production
2. Store JWT tokens securely (httpOnly cookies recommended)
3. Implement rate limiting for password change endpoints
4. Validate file uploads on both client and server
5. Sanitize all user inputs
6. Use strong password policies
7. Implement account lockout after failed login attempts
8. Log all sensitive operations for audit trails

---

## Testing with cURL

### Get Profile
```bash
curl -X GET http://localhost:5000/api/users/profile/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Profile
```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Doe",
    "phone": "+1234567890",
    "skills": ["JavaScript", "React"]
  }'
```

### Upload Avatar
```bash
curl -X POST http://localhost:5000/api/users/profile/avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

### Change Password
```bash
curl -X PUT http://localhost:5000/api/users/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword456"
  }'
```

---

**Last Updated:** 2024
**Version:** 2.0.0
**Status:** Production Ready ✅
