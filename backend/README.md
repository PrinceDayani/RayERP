# 🔧 ERP Backend API

The backend API server for the ERP Management System built with Express.js, TypeScript, and MongoDB.

## 🚀 Technology Stack

- **Express.js** - Node.js web framework
- **TypeScript** - Type-safe server development
- **MongoDB** - NoSQL database with Mongoose ODM
- **Socket.IO** - Real-time WebSocket communication
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing and security
- **Winston** - Comprehensive logging
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
src/
├── controllers/           # Business logic handlers
│   ├── authController.ts         # Authentication logic
│   ├── employeeController.ts     # Employee management
│   ├── projectController.ts      # Project management
│   ├── taskController.ts         # Task management
│   ├── attendanceController.ts   # Attendance tracking
│   ├── inventoryController.ts    # Inventory management
│   ├── orderController.ts        # Order processing
│   ├── customerController.ts     # Customer management
│   ├── supplierController.ts     # Supplier management
│   ├── contactController.ts      # Contact management
│   ├── userController.ts         # User management
│   ├── reportController.ts       # Reports and analytics
│   ├── settingsController.ts     # System settings
│   └── analyticsController.ts    # Business analytics
├── middleware/           # Request processing middleware
│   ├── auth.middleware.ts        # JWT authentication
│   ├── rbac.middleware.ts        # Role-based access control
│   ├── validation.middleware.ts  # Input validation
│   ├── error.middleware.ts       # Error handling
│   └── activity.middleware.ts    # Activity logging
├── models/              # MongoDB schemas and models
│   ├── User.ts                   # User model
│   ├── Employee.ts               # Employee model
│   ├── Project.ts                # Project model
│   ├── Task.ts                   # Task model
│   ├── Attendance.ts             # Attendance model
│   ├── Leave.ts                  # Leave management
│   ├── Product.ts                # Product model
│   ├── Inventory.ts              # Inventory model
│   ├── Order.ts                  # Order model
│   ├── Customer.ts               # Customer model
│   ├── Supplier.ts               # Supplier model
│   ├── Contact.ts                # Contact model
│   ├── Role.ts                   # Role model
│   ├── Permission.ts             # Permission model
│   └── ActivityLog.ts            # Activity logging
├── routes/              # API route definitions
│   ├── index.ts                  # Route aggregation
│   ├── auth.routes.ts            # Authentication routes
│   ├── employee.routes.ts        # Employee routes
│   ├── project.routes.ts         # Project routes
│   ├── task.routes.ts            # Task routes
│   ├── attendance.routes.ts      # Attendance routes
│   ├── inventory.routes.ts       # Inventory routes
│   ├── order.routes.ts           # Order routes
│   ├── customer.routes.ts        # Customer routes
│   ├── supplier.routes.ts        # Supplier routes
│   ├── contact.routes.ts         # Contact routes
│   ├── user.routes.ts            # User routes
│   ├── report.routes.ts          # Report routes
│   └── analytics.routes.ts       # Analytics routes
├── utils/               # Helper functions and utilities
│   ├── logger.ts                 # Winston logger configuration
│   ├── socket.utils.ts           # Socket.IO utilities
│   ├── socketEvents.ts           # Socket event definitions
│   ├── taskUtils.ts              # Task-related utilities
│   └── timelineHelper.ts         # Timeline management
└── server.ts            # Application entry point
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)
```
POST   /register          # User registration
POST   /login             # User login
POST   /logout            # User logout
GET    /me                # Get current user
POST   /refresh           # Refresh JWT token
POST   /forgot-password   # Password reset request
POST   /reset-password    # Password reset confirmation
```

### Employee Management (`/api/employees`)
```
GET    /                  # Get all employees
POST   /                  # Create new employee
GET    /:id               # Get employee by ID
PUT    /:id               # Update employee
DELETE /:id               # Delete employee
GET    /:id/attendance    # Get employee attendance
GET    /:id/leaves        # Get employee leaves
GET    /:id/tasks         # Get employee tasks
```

### Attendance Management (`/api/attendance`)
```
GET    /                  # Get attendance records
POST   /checkin           # Employee check-in
POST   /checkout          # Employee check-out
GET    /today-stats       # Today's attendance statistics
GET    /:employeeId       # Get employee attendance history
PUT    /:id               # Update attendance record
DELETE /:id               # Delete attendance record
```

### Project Management (`/api/projects`)
```
GET    /                  # Get all projects
POST   /                  # Create new project
GET    /:id               # Get project by ID
PUT    /:id               # Update project
DELETE /:id               # Delete project
GET    /:id/tasks         # Get project tasks
GET    /:id/team          # Get project team members
POST   /:id/team          # Add team member
DELETE /:id/team/:userId  # Remove team member
```

### Task Management (`/api/tasks`)
```
GET    /                  # Get all tasks
POST   /                  # Create new task
GET    /:id               # Get task by ID
PUT    /:id               # Update task
DELETE /:id               # Delete task
PATCH  /:id/status        # Update task status
POST   /:id/comments      # Add task comment
GET    /:id/timeline      # Get task timeline
GET    /my-tasks          # Get current user's tasks
```

### Inventory Management (`/api/inventory`)
```
GET    /                  # Get inventory items
POST   /                  # Add inventory item
GET    /:id               # Get inventory item by ID
PUT    /:id               # Update inventory item
DELETE /:id               # Delete inventory item
PUT    /:id/adjust        # Adjust inventory levels
GET    /low-stock         # Get low stock items
GET    /transactions      # Get inventory transactions
```

### Product Management (`/api/products`)
```
GET    /                  # Get all products
POST   /                  # Create new product
GET    /:id               # Get product by ID
PUT    /:id               # Update product
DELETE /:id               # Delete product
GET    /categories        # Get product categories
GET    /search            # Search products
```

### Order Management (`/api/orders`)
```
GET    /                  # Get all orders
POST   /                  # Create new order
GET    /:id               # Get order by ID
PUT    /:id               # Update order
DELETE /:id               # Delete order
PATCH  /:id/status        # Update order status
GET    /:id/items         # Get order items
POST   /:id/items         # Add order item
```

### Customer Management (`/api/customers`)
```
GET    /                  # Get all customers
POST   /                  # Create new customer
GET    /:id               # Get customer by ID
PUT    /:id               # Update customer
DELETE /:id               # Delete customer
GET    /:id/orders        # Get customer orders
GET    /:id/history       # Get customer history
```

### Supplier Management (`/api/suppliers`)
```
GET    /                  # Get all suppliers
POST   /                  # Create new supplier
GET    /:id               # Get supplier by ID
PUT    /:id               # Update supplier
DELETE /:id               # Delete supplier
GET    /:id/products      # Get supplier products
GET    /:id/orders        # Get supplier orders
```

### User Management (`/api/users`)
```
GET    /                  # Get all users (admin only)
POST   /                  # Create new user (admin only)
GET    /:id               # Get user by ID
PUT    /:id               # Update user
DELETE /:id               # Delete user (admin only)
PUT    /:id/role          # Update user role (admin only)
PUT    /:id/permissions   # Update user permissions (admin only)
```

### Reports & Analytics (`/api/reports`, `/api/analytics`)
```
GET    /reports/employees      # Employee reports
GET    /reports/projects       # Project reports
GET    /reports/inventory      # Inventory reports
GET    /reports/sales          # Sales reports
GET    /analytics/dashboard    # Dashboard statistics
GET    /analytics/trends       # Business trends
GET    /analytics/performance  # Performance metrics
```

## 🔐 Authentication & Authorization

### JWT Authentication
```typescript
// JWT token structure
{
  "userId": "user_id",
  "email": "user@example.com",
  "role": "ADMIN",
  "permissions": ["read:users", "write:projects"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Role-Based Access Control (RBAC)
```typescript
// Role hierarchy
enum UserRole {
  ROOT = 'ROOT',
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  NORMAL = 'NORMAL'
}

// Permission system
const permissions = {
  'read:users': 'Can view user information',
  'write:users': 'Can create/update users',
  'delete:users': 'Can delete users',
  'manage:projects': 'Can manage projects',
  'manage:inventory': 'Can manage inventory'
};
```

### Middleware Usage
```typescript
// Protected route example
router.get('/admin-only', 
  authMiddleware,           // Verify JWT token
  rbacMiddleware(['ADMIN']), // Check role
  adminController.getData
);

// Permission-based protection
router.post('/users',
  authMiddleware,
  permissionMiddleware(['write:users']),
  userController.create
);
```

## 🔄 Real-time Features (Socket.IO)

### Socket Events
```typescript
// Employee events
'employee:created'    // New employee added
'employee:updated'    // Employee information updated
'employee:deleted'    // Employee removed

// Attendance events
'attendance:checkin'  // Employee checked in
'attendance:checkout' // Employee checked out

// Project events
'project:created'     // New project created
'project:updated'     # Project details updated
'task:assigned'       // Task assigned to user
'task:completed'      // Task marked as completed

// System events
'notification:new'    // New notification
'activity:logged'     // New activity logged
```

### Socket Implementation
```typescript
// Socket connection handling
io.on('connection', (socket) => {
  // Join user-specific room
  socket.join(`user:${userId}`);
  
  // Join role-specific room
  socket.join(`role:${userRole}`);
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', userId);
  });
});

// Broadcasting events
io.to(`role:ADMIN`).emit('employee:created', employeeData);
io.to(`user:${userId}`).emit('task:assigned', taskData);
```

## 🗄️ Database Models

### User Model
```typescript
interface IUser {
  _id: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Employee Model
```typescript
interface IEmployee {
  _id: ObjectId;
  user: ObjectId;           // Reference to User
  employeeId: string;
  department: string;
  position: string;
  salary: number;
  hireDate: Date;
  manager: ObjectId;        // Reference to Employee
  skills: string[];
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  status: 'active' | 'inactive' | 'terminated';
  createdAt: Date;
  updatedAt: Date;
}
```

### Project Model
```typescript
interface IProject {
  _id: ObjectId;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: Date;
  endDate: Date;
  budget: number;
  manager: ObjectId;        // Reference to Employee
  team: ObjectId[];         // References to Employees
  tags: string[];
  progress: number;         // 0-100
  createdBy: ObjectId;      // Reference to User
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v22.x recommended)
- MongoDB (local or cloud instance)
- npm (v10.0.0+)

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Configuration**
```bash
# Create .env file
cp .env.example .env

# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Seed initial data
npm run seed
```

4. **Development Server**
```bash
npm run dev
```

5. **Production Build**
```bash
npm run build
npm start
```

## 🔧 Environment Variables

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/erp-system
# or MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/erp-system

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload (optional)
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## 📊 Logging & Monitoring

### Winston Logger Configuration
```typescript
// Log levels: error, warn, info, http, verbose, debug, silly
logger.info('Server started on port 5000');
logger.error('Database connection failed', { error });
logger.warn('High memory usage detected');
```

### Activity Logging
```typescript
// Automatic activity logging
{
  user: ObjectId,
  action: 'CREATE_EMPLOYEE',
  resource: 'Employee',
  resourceId: ObjectId,
  details: { ... },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  timestamp: Date
}
```

## 🧪 Testing

### API Testing Script
```bash
# Test all endpoints
node test-backend.js
```

### Manual Testing
```bash
# Health check
curl http://localhost:5000/api/health

# Authentication test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

## 🚀 Deployment

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Configure production MongoDB instance
- [ ] Set secure JWT secrets
- [ ] Configure HTTPS
- [ ] Set up reverse proxy (nginx)
- [ ] Configure logging and monitoring
- [ ] Set up backup strategies
- [ ] Configure rate limiting
- [ ] Set up health checks

### Docker Deployment
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔒 Security Features

### Security Middleware
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request rate limiting
- **Input Validation** - Request validation
- **SQL Injection Protection** - MongoDB injection prevention
- **XSS Protection** - Cross-site scripting prevention

### Password Security
```typescript
// Password hashing
const hashedPassword = await bcrypt.hash(password, 12);

// Password validation
const isValid = await bcrypt.compare(password, hashedPassword);
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose ODM](https://mongoosejs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [JWT.io](https://jwt.io/)

---

**Backend API built with security, scalability, and performance in mind**