# User Onboarding System with RBAC

## Overview
Complete User Onboarding system with Role-Based Access Control (RBAC) and Project Assignment for RayERP.

## Features
- ✅ Role Assignment (Admin, Manager, Employee, Student)
- ✅ Project Assignment with access levels (read/write/admin)
- ✅ Automatic access control based on roles and projects
- ✅ Modular design for different ERP modules
- ✅ Scalable and secure architecture

## Quick Start

### 1. Setup Test Data
```bash
cd backend
node testOnboarding.js
```

### 2. Start Backend Server
```bash
cd backend
npm run dev
```

### 3. Start Frontend Server
```bash
cd frontend
npm run dev
```

### 4. Login Credentials
- **Admin**: admin@rayerp.com / admin123
- **Employee**: john@rayerp.com / employee123

## Usage

### Admin Dashboard
1. Login as admin
2. Navigate to `/dashboard/admin/onboarding`
3. Create new users with roles and project assignments

### User Dashboard
1. Login as any user
2. View assigned projects and access levels
3. Access only relevant modules based on role

## API Endpoints

### Onboarding
- `POST /api/onboarding/create` - Create new user with roles and projects
- `GET /api/onboarding/data` - Get available roles and projects
- `GET /api/onboarding/user/:userId` - Get user with project assignments

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

## File Structure

### Backend
```
backend/src/
├── models/
│   ├── User.ts              # User model with roles
│   ├── Role.ts              # Role model with permissions
│   ├── UserProject.ts       # User-Project relationship
│   └── Project.ts           # Project model
├── controllers/
│   └── onboardingController.ts  # Onboarding logic
├── routes/
│   └── onboarding.routes.ts     # Onboarding routes
└── middleware/
    └── projectRbac.middleware.ts # RBAC middleware
```

### Frontend
```
frontend/src/
├── components/admin/
│   ├── UserOnboarding.tsx      # User creation form
│   └── UserDashboard.tsx       # Role-based dashboard
├── app/dashboard/
│   ├── page.tsx                # Main dashboard
│   └── admin/onboarding/
│       └── page.tsx            # Onboarding page
└── lib/api/
    └── onboardingAPI.ts        # API utilities
```

## Role Hierarchy
1. **Root** - Complete system access
2. **Super Admin** - Administrative access
3. **Admin** - Management access
4. **Normal** - Standard employee access

## Project Access Levels
- **Read** - View project data
- **Write** - Modify project data
- **Admin** - Full project control

## Security Features
- Password hashing with bcrypt
- JWT token authentication
- Role-based route protection
- Project-level access control
- Input validation and sanitization

## Testing
1. Run test script to create sample data
2. Login with different user roles
3. Test onboarding new users
4. Verify access control works correctly

## Next Steps
- Add more granular permissions
- Implement audit logging
- Add bulk user import
- Create role templates
- Add project-specific permissions