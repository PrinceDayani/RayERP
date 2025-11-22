# User Profile Feature - Complete Documentation

## 🎯 Overview
The User Profile feature provides a comprehensive interface for users to view and manage their personal information, including employee details, skills, projects, and security settings.

## ✨ Features

### 1. Profile Viewing
- **Personal Information**: Name, email, phone, department, position
- **Employee Details**: Employee ID, hire date, status, salary
- **Role & Permissions**: Display user role with color-coded badges
- **Skills Management**: View and edit professional skills
- **Address Information**: Complete address management
- **Project Overview**: View all assigned projects with status and progress

### 2. Profile Editing
- **Inline Editing**: Edit profile information without page reload
- **Real-time Updates**: Changes reflect immediately after saving
- **Validation**: Client and server-side validation
- **Error Handling**: User-friendly error messages

### 3. Avatar Management
- **Upload**: Support for JPEG, JPG, PNG, GIF, WEBP formats
- **Preview**: Real-time preview of uploaded avatar
- **Size Limit**: Maximum 5MB file size
- **Fallback**: Color-coded initials when no avatar is set

### 4. Security Features
- **Password Change**: Secure password update with validation
- **Current Password Verification**: Requires current password for changes
- **Password Strength**: Minimum 6 characters requirement
- **Confirmation**: Password confirmation to prevent typos

### 5. Resume Generation
- **Download**: Generate and download professional resume
- **Format**: Plain text format with structured sections
- **Content**: Includes personal info, skills, and project history
- **Filename**: Auto-generated based on user name

## 📁 File Structure

```
RayERP/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── dashboard/
│   │   │       └── profile/
│   │   │           └── page.tsx                    # Main profile page
│   │   └── components/
│   │       └── settings/
│   │           └── PasswordChangeDialog.tsx        # Password change component
│   └── ...
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── userController.ts                   # Profile controllers
│   │   ├── models/
│   │   │   ├── User.ts                            # User model
│   │   │   └── Employee.ts                        # Employee model
│   │   ├── routes/
│   │   │   └── user.routes.ts                     # Profile routes
│   │   └── middleware/
│   │       ├── auth.middleware.ts                 # Authentication
│   │       └── upload.middleware.ts               # File upload
│   └── ...
└── PROFILE_API_DOCUMENTATION.md                    # API documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js v22.x
- MongoDB running
- Backend server running on port 5000
- Frontend server running on port 3000

### Installation

1. **Backend Setup** (if not already done)
```bash
cd backend
npm install
npm run dev
```

2. **Frontend Setup** (if not already done)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### Access Profile Page
Navigate to: `http://localhost:3000/dashboard/profile`

## 💻 Usage Guide

### Viewing Profile
1. Login to the application
2. Navigate to Dashboard → Profile
3. View your complete profile information

### Editing Profile
1. Click "Edit Profile" button
2. Modify desired fields
3. Click "Save" to update
4. Click "Cancel" to discard changes

### Uploading Avatar
1. Click "Edit Profile"
2. Click the camera icon on avatar
3. Select image file (max 5MB)
4. Image uploads automatically

### Changing Password
1. Click "Change Password" button
2. Enter current password
3. Enter new password (min 6 characters)
4. Confirm new password
5. Click "Change Password"

### Downloading Resume
1. Click "Download Resume" button
2. Resume downloads as text file
3. File includes all profile and project information

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
MONGO_URI=mongodb://localhost:27017/rayerp
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=5000
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Upload Configuration
Located in: `backend/src/middleware/upload.middleware.ts`

```typescript
// Modify these settings as needed
const storage = multer.diskStorage({
  destination: './uploads/avatars',
  filename: 'avatar-{timestamp}-{random}.{ext}'
});

const limits = {
  fileSize: 5 * 1024 * 1024  // 5MB
};

const allowedTypes = /jpeg|jpg|png|gif|webp/;
```

## 🎨 UI Components

### Profile Card
- **Avatar**: Large circular avatar with role-based color
- **Name & Title**: User name and position
- **Role Badge**: Color-coded role indicator
- **Status Badge**: Active/Inactive status

### Information Grid
- **3-Column Layout**: Responsive grid for profile fields
- **Icon Labels**: Visual indicators for each field
- **Edit Mode**: Inline input fields when editing

### Projects Section
- **Card Grid**: Responsive project cards
- **Status Badges**: Visual project status indicators
- **Progress Display**: Percentage completion
- **Priority Indicators**: Color-coded priority levels

## 🔐 Security Features

### Authentication
- JWT token-based authentication
- Token stored in localStorage
- Automatic token refresh
- Secure password hashing (bcrypt)

### Authorization
- Role-based access control
- User can only edit own profile
- Admin can view all profiles
- SuperAdmin can modify any profile

### Data Validation
- Client-side validation
- Server-side validation
- Input sanitization
- XSS protection

### File Upload Security
- File type validation
- File size limits
- Secure filename generation
- Isolated storage directory

## 📊 Data Models

### User Model
```typescript
interface IUser {
  name: string;
  email: string;
  password: string;
  role: ObjectId;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: Date;
}
```

### Employee Model
```typescript
interface IEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  salary: number;
  hireDate: Date;
  status: 'active' | 'inactive' | 'terminated';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  skills: string[];
  avatarUrl: string;
  user: ObjectId;
}
```

## 🔄 API Endpoints

### User Endpoints
- `GET /api/users/profile` - Get basic profile
- `GET /api/users/profile/complete` - Get complete profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/profile/avatar` - Upload avatar
- `PUT /api/users/change-password` - Change password

### Admin Endpoints
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/role` - Update user role
- `PUT /api/users/:id/reset-password` - Reset password
- `DELETE /api/users/:id` - Delete user

See [PROFILE_API_DOCUMENTATION.md](./PROFILE_API_DOCUMENTATION.md) for detailed API documentation.

## 🎯 Role-Based Features

### All Users
- View own profile
- Edit own profile
- Upload avatar
- Change password
- Download resume

### Admin
- View all user profiles
- Edit user information
- Assign roles (below admin level)

### SuperAdmin
- All admin features
- Reset user passwords
- Delete users
- Assign any role (except Root)
- Bulk operations

### Root
- All SuperAdmin features
- Cannot be modified or deleted
- Highest privilege level

## 🐛 Troubleshooting

### Avatar Not Displaying
1. Check if uploads directory exists: `backend/uploads/avatars/`
2. Verify file permissions
3. Check server static file serving configuration
4. Ensure correct API URL in frontend

### Profile Not Loading
1. Verify JWT token in localStorage
2. Check backend server is running
3. Verify MongoDB connection
4. Check browser console for errors

### Upload Failing
1. Check file size (max 5MB)
2. Verify file format (JPEG, PNG, GIF, WEBP)
3. Check server upload directory permissions
4. Verify multer middleware configuration

### Password Change Failing
1. Verify current password is correct
2. Check new password meets requirements (min 6 chars)
3. Ensure passwords match
4. Check server logs for errors

## 📈 Performance Optimization

### Frontend
- Lazy loading for images
- Debounced input fields
- Optimistic UI updates
- Cached profile data

### Backend
- Indexed database queries
- Lean queries for better performance
- Pagination for large datasets
- Compressed responses

## 🧪 Testing

### Manual Testing Checklist
- [ ] View profile information
- [ ] Edit profile fields
- [ ] Upload avatar image
- [ ] Change password
- [ ] Download resume
- [ ] Cancel edit mode
- [ ] Test with different roles
- [ ] Test error scenarios

### API Testing with cURL
```bash
# Get profile
curl -X GET http://localhost:5000/api/users/profile/complete \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update profile
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"John Doe","phone":"+1234567890"}'

# Upload avatar
curl -X POST http://localhost:5000/api/users/profile/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@image.jpg"
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Social media links
- [ ] Profile visibility settings
- [ ] Two-factor authentication
- [ ] Profile completion percentage
- [ ] Activity timeline
- [ ] Skill endorsements
- [ ] Profile themes
- [ ] Export to PDF resume
- [ ] Profile sharing
- [ ] Custom fields

### Improvements
- [ ] Image cropping tool
- [ ] Multiple avatar options
- [ ] Profile templates
- [ ] Advanced search
- [ ] Profile analytics
- [ ] Notification preferences
- [ ] Privacy controls

## 📞 Support

### Common Issues
1. **Token Expired**: Re-login to get new token
2. **Permission Denied**: Check user role and permissions
3. **Upload Failed**: Verify file size and format
4. **Data Not Saving**: Check network connection and server logs

### Getting Help
- Check server logs: `backend/logs/`
- Check browser console for frontend errors
- Review API documentation
- Contact system administrator

## 📝 Best Practices

### For Users
1. Use strong passwords (8+ characters, mixed case, numbers, symbols)
2. Keep profile information up to date
3. Use professional profile picture
4. List relevant skills accurately
5. Review profile regularly

### For Developers
1. Always validate user input
2. Use prepared statements for database queries
3. Implement proper error handling
4. Log security-related events
5. Keep dependencies updated
6. Follow coding standards
7. Write comprehensive tests
8. Document API changes

## 📄 License
Part of RayERP - Enterprise Resource Planning System

---

**Version:** 2.0.0  
**Status:** Production Ready ✅  
**Last Updated:** 2024

For technical support or feature requests, please contact the development team.
