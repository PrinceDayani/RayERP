# 🎨 RayERP Frontend

Next.js 15 + TypeScript + Tailwind CSS frontend for RayERP Enterprise Resource Planning System.

## 🚀 Technology Stack

- **Next.js 15** - App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **Socket.IO Client** - Real-time updates
- **React Hook Form** - Forms
- **Recharts** - Charts
- **Axios** - HTTP client

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Main application
│   │   ├── finance/       # Financial management
│   │   ├── general-ledger/ # GL & accounting
│   │   ├── budgets/       # Budget management
│   │   ├── department-budgets/ # Department budgets
│   │   ├── projects/      # Project management
│   │   ├── tasks/         # Task management
│   │   ├── employees/     # Employee management
│   │   ├── departments/   # Department management
│   │   ├── resources/     # Resource allocation
│   │   ├── analytics/     # Analytics dashboard
│   │   ├── reports/       # Reports
│   │   ├── contacts/      # Contact management
│   │   ├── chat/          # Team chat
│   │   ├── activity/      # Activity logs
│   │   ├── admin/         # Admin panel
│   │   ├── system-admin/  # System administration
│   │   ├── users/         # User management
│   │   ├── settings/      # Settings
│   │   ├── profile/       # User profile
│   │   └── my-assignments/ # User assignments
│   ├── login/             # Authentication
│   ├── signup/            # Registration
│   └── shared-files/      # File sharing
├── components/            # React components
│   ├── ui/               # Shadcn/ui components (50+)
│   ├── finance/          # Finance components
│   ├── budget/           # Budget components
│   ├── projects/         # Project components
│   ├── tasks/            # Task components
│   ├── employee/         # Employee components
│   ├── admin/            # Admin components
│   ├── system-admin/     # System admin components
│   ├── chat/             # Chat components
│   ├── resources/        # Resource components
│   ├── analytics/        # Analytics components
│   ├── approvals/        # Approval components
│   ├── bills/            # Bills components
│   ├── backup/           # Backup components
│   ├── attendance/       # Attendance components
│   ├── leave/            # Leave components
│   ├── settings/         # Settings components
│   └── ... (30+ more)
├── lib/                  # Utilities
│   ├── api/              # 80+ API client files
│   │   ├── finance/      # Finance APIs
│   │   ├── authAPI.ts
│   │   ├── projectsAPI.ts
│   │   ├── budgetAPI.ts
│   │   ├── financialReportsAPI.ts
│   │   └── ... (75+ more)
│   └── utils.ts
├── hooks/                # Custom hooks
│   ├── finance/          # Finance hooks
│   ├── tasks/            # Task hooks
│   ├── queries/          # React Query hooks
│   └── ... (30+ hooks)
├── contexts/             # React contexts
│   ├── socket/           # Socket contexts
│   ├── AuthContext.tsx
│   ├── CurrencyContext.tsx
│   ├── FinanceContext.tsx
│   └── ... (8+ contexts)
├── types/                # TypeScript types
│   ├── finance/          # Finance types
│   ├── tasks/            # Task types
│   └── ... (10+ type files)
├── config/               # Configuration
├── providers/            # App providers
└── utils/                # Helper utilities
```

## 🎯 Core Features

### 💰 Finance Module
- Chart of Accounts
- General Ledger
- Journal Entries
- Financial Reports (9 types)
- Invoices & Vouchers
- Budget Management
- Approval Workflows
- Multi-currency support

### 📊 Project Management
- Project dashboard
- Task management (Kanban)
- Team collaboration
- File sharing
- Timeline & milestones
- Budget tracking
- Permissions management

### 👥 Employee Management
- Employee directory
- Attendance tracking
- Leave management
- Career timeline
- Salary management
- Skills matrix

### 📈 Analytics & Reports
- Real-time dashboards
- Financial reports
- Project analytics
- Task analytics
- Custom reports

### 💬 Communication
- Team chat
- Notifications
- Broadcasts
- Real-time updates

## 🚀 Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Setup environment
cp .env.example .env.local

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## 🔧 Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🎨 UI Components (Shadcn/ui)

Button, Input, Select, Dialog, Table, Card, Badge, Progress, Tabs, Toast, Alert, Avatar, Calendar, Checkbox, Command, Dropdown, Form, Label, Popover, Radio, Scroll Area, Separator, Sheet, Skeleton, Slider, Switch, Textarea, Tooltip

## 🔌 API Integration

All API clients in `lib/api/`:
- Authentication
- Finance & Accounting
- Projects & Tasks
- Employees & HR
- Budgets & Forecasting
- Reports & Analytics
- Settings & Admin

## 🔄 Real-Time Features

- Live notifications
- Chat messaging
- Task updates
- Approval updates
- Dashboard metrics

## 🔐 Security

- JWT authentication
- Role-based access control
- Permission guards
- Protected routes
- Finance module 3-layer protection

## 📱 Responsive Design

Mobile-first approach with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🧪 Development

### Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm start` - Start production
- `npm run lint` - Lint code

### Best Practices
- TypeScript for type safety
- Component composition
- Custom hooks for logic
- Error boundaries
- Loading states

## 🐛 Troubleshooting

1. **API Connection**: Check `NEXT_PUBLIC_API_URL` in `.env.local`
2. **Auth Issues**: Clear cookies and re-login
3. **Build Errors**: Clear `.next` folder and rebuild

## 📚 Documentation

See root README.md for complete system documentation.

---

**Version**: 2.0.0  
**Status**: Production Ready ✅
