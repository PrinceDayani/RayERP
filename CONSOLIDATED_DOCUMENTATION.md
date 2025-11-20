# RayERP - Complete Documentation

## 🚀 Quick Start

### Prerequisites
- Node.js (v22.x recommended)
- MongoDB (local or cloud instance)
- npm (v10.0.0+)

### Installation & Setup

1. **Clone and Install**
```bash
cd RayERP
npm install
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env.local
# Configure your .env.local file
npm run dev
```

### URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🏗️ Architecture

### Backend (Express.js + TypeScript + MongoDB)
- **Express.js** - Node.js web framework
- **TypeScript** - Type-safe server development
- **MongoDB** - NoSQL database with Mongoose ODM
- **Socket.IO** - Real-time WebSocket communication
- **JWT** - JSON Web Token authentication

### Frontend (Next.js 15 + TypeScript + Tailwind)
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern component library
- **Socket.IO Client** - Real-time communication

## 📁 Project Structure

```
RayERP/
├── backend/                    # Backend API server
│   ├── src/
│   │   ├── controllers/       # Business logic handlers
│   │   ├── middleware/        # Request processing middleware
│   │   ├── models/           # MongoDB schemas and models
│   │   ├── routes/           # API route definitions
│   │   ├── utils/            # Helper functions and utilities
│   │   └── server.ts         # Application entry point
│   ├── scripts/              # Database seeding scripts
│   ├── .env                  # Environment configuration
│   └── package.json          # Backend dependencies
├── frontend/                  # Frontend Next.js application
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # Reusable components
│   │   ├── lib/              # Utilities and API clients
│   │   ├── hooks/            # Custom React hooks
│   │   └── types/            # TypeScript type definitions
│   ├── .env.local            # Frontend environment
│   └── package.json          # Frontend dependencies
└── docker-compose.yml        # Container deployment
```

## 🔌 Core Features

### 👥 Employee Management
- Employee directory with search and filters
- Attendance tracking interface
- Leave management system
- Employee profile management

### 📋 Project Management
- Project dashboard with progress tracking
- Kanban-style task boards
- Team collaboration features
- Project analytics and reporting

### 📦 Inventory Management
- Product catalog with categories
- Stock level monitoring
- Inventory adjustment tools
- Low stock alerts

### 🛒 Order Management
- Order creation and processing
- Order status tracking
- Customer order history
- Order analytics

### 💰 Finance & Accounting
- Chart of Accounts with industry templates
- Cost Centers with budget management
- General Ledger with journal entries
- Financial reports and analytics
- Recurring entries automation
- Invoice and payment tracking

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based routing
- Session management
- Input validation and sanitization

## 🔧 Environment Configuration

### Backend (.env)
```env
# Database Configuration
MONGO_URI=mongodb+srv://your-connection-string
# or local: mongodb://localhost:27017/erp-system

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Logging Configuration
LOG_LEVEL=info
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_ENABLE_SOCKET=true
NODE_ENV=development
```

## 🚀 Production Deployment

### Build Commands
```bash
# Backend
cd backend
npm run build:prod
npm run start:prod

# Frontend
cd frontend
npm run build
npm start
```

### Docker Deployment
```bash
docker-compose up -d
```

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

## 🔒 Security Features

### Authentication & Authorization
- JWT token validation
- Role-based access control
- Permission-based routing
- Session management

### Input Protection
- XSS prevention
- SQL injection protection
- Path traversal prevention
- File upload security

### Network Security
- CSRF token protection
- CORS configuration
- Rate limiting
- Security headers

## 📊 API Endpoints

### Authentication (`/api/auth`)
- POST /register - User registration
- POST /login - User login
- POST /logout - User logout
- GET /me - Get current user
- POST /refresh - Refresh JWT token

### Employee Management (`/api/employees`)
- GET / - Get all employees
- POST / - Create new employee
- GET /:id - Get employee by ID
- PUT /:id - Update employee
- DELETE /:id - Delete employee

### Project Management (`/api/projects`)
- GET / - Get all projects
- POST / - Create new project
- GET /:id - Get project by ID
- PUT /:id - Update project
- DELETE /:id - Delete project

### Finance (`/api/finance`)
- Chart of Accounts endpoints
- Cost Centers endpoints
- General Ledger endpoints
- Financial Reports endpoints
- Recurring Entries endpoints

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### API Testing
```bash
# Health check
curl http://localhost:5000/api/health

# Authentication test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check NEXT_PUBLIC_API_URL environment variable
   - Ensure backend server is running
   - Verify CORS configuration

2. **Authentication Issues**
   - Clear browser cookies
   - Check JWT token expiration
   - Verify API endpoints

3. **Build Errors**
   - Clear .next folder
   - Update dependencies
   - Check TypeScript errors

4. **Database Connection**
   - Verify MongoDB URI
   - Check network connectivity
   - Ensure database is running

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Socket.IO Documentation](https://socket.io/docs/)

## 🎯 Development Guidelines

### Code Organization
- Feature-based folder structure
- Reusable component patterns
- Custom hooks for logic
- TypeScript for type safety

### Best Practices
- Component composition over inheritance
- Props interface definitions
- Error boundary implementation
- Loading state management
- Optimistic UI updates

## 📈 Performance Optimizations

### Next.js Features
- App Router - Improved routing and layouts
- Server Components - Reduced client-side JavaScript
- Image Optimization - Automatic image optimization
- Code Splitting - Automatic code splitting

### React Optimizations
- Lazy Loading - Component lazy loading
- Memoization - React.memo and useMemo
- Virtual Scrolling - For large lists
- Debounced Search - Optimized search inputs

---

**RayERP - Complete Enterprise Resource Planning System**
**Version**: 2.0.0
**Status**: Production Ready ✅
**Last Updated**: 2024