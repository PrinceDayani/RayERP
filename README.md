# RayERP - Enterprise Resource Planning System

## 🚀 Quick Start

### Prerequisites
- Node.js (v22.x recommended)
- MongoDB (local or cloud instance)
- npm (v10.0.0+)

### Installation

1. **Clone and Setup**
```bash
cd RayERP
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### Access URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🏗️ Architecture

### Backend
- **Express.js + TypeScript** - RESTful API server
- **MongoDB + Mongoose** - Database and ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication and authorization

### Frontend
- **Next.js 15 + TypeScript** - React framework
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **Socket.IO Client** - Real-time updates

## 📁 Project Structure

```
RayERP/
├── backend/                    # API Server
│   ├── src/
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Request processing
│   │   ├── models/           # Database schemas
│   │   ├── modules/          # Modular features (NEW)
│   │   │   └── projects/     # Project modules
│   │   │       ├── tasks/    # Task management
│   │   │       ├── budget/   # Budget & planning
│   │   │       ├── timeline/ # Timeline & events
│   │   │       ├── files/    # File management
│   │   │       ├── finance/  # Analytics & metrics
│   │   │       ├── permissions/ # Access control
│   │   │       └── activity/ # Activity logs
│   │   ├── routes/           # API endpoints
│   │   ├── utils/            # Helper functions
│   │   └── server.ts         # Entry point
│   ├── .env.example          # Environment template
│   └── package.json          # Dependencies
├── frontend/                  # Next.js App
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # UI components
│   │   ├── lib/              # Utilities & API clients
│   │   └── types/            # TypeScript definitions
│   ├── .env.example          # Environment template
│   └── package.json          # Dependencies
├── docker-compose.yml        # Container deployment
└── CONSOLIDATED_DOCUMENTATION.md  # Complete docs
```

## 🔧 Environment Configuration

### Backend (.env)
```env
MONGO_URI=mongodb://localhost:27017/rayerp
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secure-secret-key
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NODE_ENV=development
```

## 🎯 Core Features

- **Employee Management** - Directory, attendance, leave management
- **Project Management** - Projects, tasks, team collaboration
- **Order Management** - Order processing and tracking
- **Finance & Accounting** - Chart of accounts, ledger, reports
- **Authentication & Security** - JWT, RBAC, permissions

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

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Authentication Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

## 📚 Documentation

### Available Documentation
- **PROJECT_PERMISSION_FIX.md** - Multiple managers & assigned user access fix
- **PROJECT_ACCESS_QUICK_REFERENCE.md** - Project access control quick reference
- **TEAM_MANAGEMENT_FIX.md** - Team/member management implementation
- **CURRENCY_SYSTEM_FIX.md** - Currency system standardization
- **CURRENCY_QUICK_REFERENCE.md** - Currency quick reference
- **PROJECT_MODULAR_ARCHITECTURE.md** - Modular project architecture
- **DEPARTMENT_SYSTEM_ENHANCED.md** - Department management system
- **MIGRATION_SCRIPT_GUIDE.md** - Database migration guide
- **backend/README.md** - Backend API documentation
- **frontend/README.md** - Frontend application documentation
- **Documentation/** - User manuals for all modules

## 🔒 Security Features

- JWT authentication with role-based access control
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Security headers
- XSS and injection protection
- **Finance Module Permissions** - 3-layer protection (Backend API, Sidebar, Route Guards)

## 🐛 Troubleshooting

### Quick Start (Windows)
```bash
# Start both backend and frontend automatically
start-dev.bat

# Or diagnose issues
diagnose-backend.bat
```

### Common Issues

1. **Connection Issues**
   - Ensure backend is running: `cd backend && npm run dev`
   - Check authentication token is valid
   - Verify MongoDB is running

2. **Connection Issues**: Check environment variables
   - Backend: Verify `MONGO_URI`, `PORT`, `CORS_ORIGIN` in `.env`
   - Frontend: Verify `NEXT_PUBLIC_API_URL` in `.env.local`

3. **Build Errors**: Clear cache and reinstall dependencies
   ```bash
   # Backend
   cd backend
   rm -rf node_modules package-lock.json
   npm install
   
   # Frontend
   cd frontend
   rm -rf node_modules package-lock.json .next
   npm install --legacy-peer-deps
   ```

4. **Database Issues**: Verify MongoDB connection
   - Check MongoDB is running: `mongod`
   - Test connection: `curl http://localhost:5000/api/health`

5. **Port Conflicts**: Ensure ports 3000/5000 are available
   ```bash
   # Windows
   netstat -ano | findstr :5000
   netstat -ano | findstr :3000
   ```

## 📞 Support

For issues or questions, check the logs:
- Backend: `backend/logs/`
- Frontend: Browser console

---

**RayERP - Complete Enterprise Resource Planning System**
**Status**: Production Ready ✅
**Version**: 2.0.1

## 🎉 Latest Updates

### Project Permission & Access Control - Fixed ✅ (Latest)
- ✅ **Multiple Managers Support** - All managers can now access projects (not just the first one)
- ✅ **Assigned User Access** - Users with ProjectPermission records can access projects
- ✅ **Enhanced Access Control** - 6 ways to access projects (Root, View All, Owner, Team, Manager, Assigned)
- ✅ **Frontend Multi-Select** - Select multiple managers via checkbox list
- ✅ **100% Backward Compatible** - No breaking changes, existing data works
- ✅ **Comprehensive Documentation** - Full fix documentation and quick reference

See [PROJECT_PERMISSION_FIX.md](./PROJECT_PERMISSION_FIX.md) and [PROJECT_ACCESS_QUICK_REFERENCE.md](./PROJECT_ACCESS_QUICK_REFERENCE.md) for complete details.

### Unified Task System - NEW ✅ (Latest)
- ✅ **Two Task Types** - Individual tasks (standalone) + Project tasks (project-linked)
- ✅ **Self-Assignment** - Employees can create tasks for themselves
- ✅ **Manager Assignment** - Managers can assign tasks to team members
- ✅ **Full Feature Parity** - Both types support all features:
  - Time tracking (start/stop timer)
  - Comments with mentions
  - Tags with colors
  - File attachments
  - Checklists with completion tracking
  - Subtasks with progress
  - Dependencies (4 types)
  - Watchers for notifications
  - Templates and recurring tasks
  - Custom fields
  - Activity timeline
- ✅ **Permission-Based** - Role-based access control
- ✅ **Real-Time Updates** - Socket.IO for live collaboration
- ✅ **Migration Script** - Automatic data migration included

See [UNIFIED_TASK_SYSTEM.md](./UNIFIED_TASK_SYSTEM.md) and [TASK_SYSTEM_QUICK_REFERENCE.md](./TASK_SYSTEM_QUICK_REFERENCE.md) for complete details.

### Project Modular Architecture ✅
- ✅ **7 Focused Modules** - Tasks, Budget, Timeline, Files, Finance, Permissions, Activity
- ✅ **Improved Organization** - 50% reduction in main controller size
- ✅ **Better Maintainability** - Smaller, focused files (100-200 lines)
- ✅ **Enhanced Scalability** - Easy to add new modules
- ✅ **Team Collaboration** - Multiple developers can work independently
- ✅ **100% Backward Compatible** - No breaking changes, all APIs unchanged
- ✅ **Comprehensive Documentation** - README, Quick Reference, Migration Guide

See [PROJECT_MODULAR_ARCHITECTURE.md](./PROJECT_MODULAR_ARCHITECTURE.md) for complete details.

### Team/Member Management - Fixed & Simplified ✅
- ✅ **Multiple Managers** - Support for multiple project managers
- ✅ **Removed Duplication** - Eliminated duplicate fields (manager/managers, team/members)
- ✅ **Single Source of Truth** - `managers` array and `team` array only
- ✅ **Type Safety** - Consistent Employee refs throughout
- ✅ **Backward Compatible** - Virtual `manager` field for compatibility
- ✅ **Migration Script** - One-time data migration included

See [TEAM_MANAGEMENT_FIX.md](./TEAM_MANAGEMENT_FIX.md) for complete details.

### Currency System - Standardized & Type-Safe ✅
- ✅ **Backend Consistency** - USD default across Project and Budget models
- ✅ **Type Safety** - Removed all `(entity as any).currency` type casts
- ✅ **Utility Functions** - `getCurrency()` with automatic USD fallback
- ✅ **Validation** - Built-in currency code validation
- ✅ **Global Converter** - USD-based exchange rates
- ✅ **Zero Breaking Changes** - Backward compatible with existing data

See [CURRENCY_SYSTEM_FIX.md](./CURRENCY_SYSTEM_FIX.md) and [CURRENCY_QUICK_REFERENCE.md](./CURRENCY_QUICK_REFERENCE.md) for details.

### Financial System - Complete ✅
- ✅ **9 Report Types** - P&L, Balance Sheet, Cash Flow, Trial Balance, General Ledger, AR, AP, Expense, Revenue
- ✅ **Chart of Accounts** - Complete accounting structure
- ✅ **Journal Entries** - Double-entry bookkeeping
- ✅ **Invoices & Vouchers** - Financial document management
- ✅ **Budget Management** - Planning and forecasting
- ✅ **Approval Workflow** - Multi-level approval system
- ✅ **Audit Trail** - Complete activity tracking
- ✅ **Performance Optimized** - Caching and aggregation pipelines