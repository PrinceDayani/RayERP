# 🔧 RayERP Backend API

Express.js + TypeScript + MongoDB backend for RayERP Enterprise Resource Planning System.

## 🚀 Technology Stack

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB + Mongoose** - Database & ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **Winston** - Logging
- **Helmet** - Security headers

## 📁 Project Structure

```
src/
├── config/              # Database configuration
├── constants/           # Role constants
├── controllers/         # 100+ business logic handlers
│   ├── authController.ts
│   ├── employeeController.ts
│   ├── projectController.ts
│   ├── taskController.ts
│   ├── attendanceController.ts
│   ├── financialReportController.ts
│   ├── approvalController.ts
│   ├── budgetController.ts
│   ├── chartOfAccountsController.ts
│   ├── journalEnhancedController.ts
│   ├── invoiceEnhancedController.ts
│   └── ... (90+ more)
├── middleware/          # Request processing
│   ├── auth.middleware.ts
│   ├── rbac.middleware.ts
│   ├── financePermission.middleware.ts
│   ├── projectPermission.middleware.ts
│   ├── error.middleware.ts
│   ├── auditLog.middleware.ts
│   └── ... (30+ more)
├── models/              # 100+ MongoDB schemas
│   ├── User.ts
│   ├── Employee.ts
│   ├── Project.ts
│   ├── Task.ts
│   ├── ChartOfAccount.ts
│   ├── JournalEntry.ts
│   ├── Budget.ts
│   ├── ApprovalRequest.ts
│   └── ... (90+ more)
├── modules/             # Modular architecture
│   └── projects/        # Project modules (NEW)
│       ├── tasks/       # Task management
│       ├── budget/      # Budget & planning
│       ├── timeline/    # Timeline & events
│       ├── files/       # File management
│       ├── finance/     # Analytics & metrics
│       ├── permissions/ # Access control
│       └── activity/    # Activity logs
├── routes/              # 80+ API route files
│   ├── index.ts         # Route aggregation
│   ├── auth.routes.ts
│   ├── employee.routes.ts
│   ├── project.routes.ts
│   ├── financialReport.routes.ts
│   ├── approval.routes.ts
│   └── ... (75+ more)
├── services/            # Business services
│   ├── emailService.ts
│   ├── pdfService.ts
│   └── backupService.ts
├── socket/              # Real-time events
│   ├── index.ts
│   ├── notification.socket.ts
│   ├── approval.socket.ts
│   └── chat.socket.ts
├── utils/               # 60+ helper utilities
│   ├── logger.ts
│   ├── socketEvents.ts
│   ├── approvalHelper.ts
│   └── ... (55+ more)
├── scripts/             # Migration & seed scripts
├── integrations/        # Approval integrations
└── server.ts            # Entry point
```

## 🔌 Core API Endpoints

### Authentication (`/api/auth`)
```
POST   /register
POST   /login
POST   /logout
GET    /me
```

### Employees (`/api/employees`)
```
GET    /
POST   /
GET    /:id
PUT    /:id
DELETE /:id
```

### Projects (`/api/projects`)
```
GET    /
POST   /
GET    /:id
PUT    /:id
DELETE /:id
GET    /:id/tasks
GET    /:id/team
```

### Tasks (`/api/tasks`)
```
GET    /
POST   /
GET    /:id
PUT    /:id
DELETE /:id
PATCH  /:id/status
```

### Attendance (`/api/attendance`)
```
GET    /
POST   /checkin
POST   /checkout
GET    /today-stats
```

### Leaves (`/api/leaves`)
```
GET    /
POST   /
GET    /:id
PUT    /:id
DELETE /:id
```

## 💰 Financial System

### Chart of Accounts (`/api/chart-of-accounts`)
```
GET    /
POST   /
GET    /:id
PUT    /:id
DELETE /:id
```

### Journal Entries (`/api/journal-enhanced`)
```
GET    /
POST   /
GET    /:id
PUT    /:id
DELETE /:id
POST   /:id/post
```

### Invoices (`/api/invoices-enhanced`)
```
GET    /
POST   /
GET    /:id
PUT    /:id
DELETE /:id
```

### Financial Reports (`/api/financial-reports`)
```
GET    /profit-loss
GET    /balance-sheet
GET    /cash-flow
GET    /trial-balance
GET    /general-ledger
GET    /accounts-receivable
GET    /accounts-payable
GET    /expense-report
GET    /revenue-report
GET    /metrics
GET    /health
```

### Budgets (`/api/budgets`)
```
GET    /
POST   /
GET    /:id
PUT    /:id
DELETE /:id
```

### Approvals (`/api/approvals`)
```
GET    /
POST   /
GET    /:id
POST   /:id/approve
POST   /:id/reject
GET    /dashboard
```

### Vouchers (`/api/vouchers`)
```
GET    /
POST   /
GET    /:id
PUT    /:id
DELETE /:id
```

## 🔐 Security Features

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Permission-based authorization
- Finance module 3-layer protection
- Input validation & sanitization
- Rate limiting
- CORS configuration
- Helmet security headers
- Audit trail logging

## 📊 Real-Time Features (Socket.IO)

- Live notifications
- Approval updates
- Chat messaging
- Task updates
- Project activity

## 🗄️ Database Models

**Core**: User, Employee, Role, Permission, ActivityLog, AuditLog

**Projects**: Project, Task, Timeline, ProjectFile, ProjectPermission, ProjectTemplate

**Finance**: ChartOfAccount, JournalEntry, Budget, Voucher, Transaction, Expense

**Approvals**: ApprovalRequest, ApprovalWorkflow, ApprovalConfig

**HR**: Attendance, Leave, Department, EmployeeCareer

**Communication**: Notification, Chat, Broadcast

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run development server
npm run dev

# Build for production
npm run build:prod

# Start production server
npm run start:prod
```

## 🔧 Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/rayerp
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

## 📝 Health Check

```bash
GET /api/health
GET /api/test
GET /api/socket-health
```

## 📚 Documentation

See root README.md for complete system documentation.

---

**Version**: 2.0.0  
**Status**: Production Ready ✅
