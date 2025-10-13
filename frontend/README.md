# 🎨 ERP Frontend Application

The frontend application for the ERP Management System built with Next.js 15, TypeScript, and modern React patterns.

## 🚀 Technology Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern component library
- **Socket.IO Client** - Real-time communication
- **React Hook Form** - Form handling and validation
- **Recharts** - Data visualization
- **Framer Motion** - Animation library
- **Axios** - HTTP client for API requests

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Main application pages
│   │   ├── admin/         # Admin panel
│   │   ├── employees/     # Employee management
│   │   ├── projects/      # Project management
│   │   ├── inventory/     # Inventory management
│   │   ├── orders/        # Order management
│   │   ├── customers/     # Customer management
│   │   ├── suppliers/     # Supplier management
│   │   ├── contacts/      # Contact management
│   │   ├── reports/       # Reports and analytics
│   │   ├── settings/      # System settings
│   │   └── users/         # User management
│   ├── login/             # Authentication pages
│   ├── signup/            # User registration
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Base UI components (Shadcn)
│   ├── forms/            # Form components
│   ├── charts/           # Chart components
│   ├── layout/           # Layout components
│   └── theme-provider.tsx # Theme management
├── lib/                  # Utilities and configurations
│   ├── api/              # API client functions
│   └── utils.ts          # Helper utilities
├── hooks/                # Custom React hooks
├── contexts/             # React context providers
├── providers/            # App providers
└── types/                # TypeScript type definitions
```

## 🎯 Key Features

### 📊 Dashboard
- Real-time statistics and analytics
- Interactive charts and graphs
- Live data updates via WebSocket
- Responsive design for all devices

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

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based access control
- Protected routes
- Session management

## 🚀 Getting Started

### Prerequisites
- Node.js (v22.x recommended)
- npm (v10.0.0+)

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Environment Setup**
```bash
# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
```

3. **Development Server**
```bash
npm run dev
```

4. **Build for Production**
```bash
npm run build
npm start
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 UI Components

### Shadcn/ui Components Used
- **Button** - Interactive buttons with variants
- **Input** - Form input fields
- **Select** - Dropdown selections
- **Dialog** - Modal dialogs
- **Table** - Data tables with sorting
- **Card** - Content containers
- **Badge** - Status indicators
- **Progress** - Progress bars
- **Tabs** - Tabbed interfaces
- **Toast** - Notification system

### Custom Components
- **Sidebar** - Navigation sidebar
- **Header** - Application header
- **DataTable** - Enhanced data tables
- **Charts** - Various chart components
- **Forms** - Specialized form components

## 🔌 API Integration

### API Client Structure
```typescript
// lib/api/
├── api.ts              # Base API configuration
├── authAPI.ts          # Authentication endpoints
├── employeeAPI.ts      # Employee management
├── projectAPI.ts       # Project management
├── taskAPI.ts          # Task management
├── inventoryAPI.ts     # Inventory management
├── orderAPI.ts         # Order management
├── customerAPI.ts      # Customer management
├── supplierAPI.ts      # Supplier management
└── index.ts            # API exports
```

### Example API Usage
```typescript
import { employeeAPI } from '@/lib/api';

// Get all employees
const employees = await employeeAPI.getAll();

// Create new employee
const newEmployee = await employeeAPI.create(employeeData);

// Update employee
const updatedEmployee = await employeeAPI.update(id, updateData);
```

## 🔄 Real-time Features

### Socket.IO Integration
```typescript
// Real-time event listeners
socket.on('employee:created', (employee) => {
  // Handle new employee
});

socket.on('task:updated', (task) => {
  // Handle task update
});

socket.on('attendance:checkin', (attendance) => {
  // Handle attendance check-in
});
```

## 🎨 Styling & Theming

### Tailwind CSS Configuration
- Custom color palette
- Responsive breakpoints
- Component utilities
- Dark/light theme support

### Theme Provider
```typescript
// Theme switching
const { theme, setTheme } = useTheme();

// Toggle theme
setTheme(theme === 'dark' ? 'light' : 'dark');
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile-First Approach
- Progressive enhancement
- Touch-friendly interfaces
- Optimized navigation
- Responsive tables and charts

## 🔐 Authentication Flow

### Login Process
1. User enters credentials
2. Frontend sends request to `/api/auth/login`
3. Backend validates and returns JWT token
4. Token stored in HTTP-only cookie
5. Subsequent requests include token
6. Protected routes check authentication

### Route Protection
```typescript
// Middleware for protected routes
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  
  if (!token && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

## 📊 State Management

### Context Providers
- **AuthContext** - User authentication state
- **ThemeContext** - Theme management
- **SocketContext** - WebSocket connection
- **NotificationContext** - Toast notifications

### Custom Hooks
- **useAuth** - Authentication utilities
- **useSocket** - Socket.IO integration
- **useApi** - API request handling
- **useLocalStorage** - Local storage management

## 🧪 Development Guidelines

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

## 🚀 Performance Optimizations

### Next.js Features
- **App Router** - Improved routing and layouts
- **Server Components** - Reduced client-side JavaScript
- **Image Optimization** - Automatic image optimization
- **Code Splitting** - Automatic code splitting

### React Optimizations
- **Lazy Loading** - Component lazy loading
- **Memoization** - React.memo and useMemo
- **Virtual Scrolling** - For large lists
- **Debounced Search** - Optimized search inputs

## 🔧 Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Optional: Error Tracking
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## 📦 Build & Deployment

### Build Process
```bash
# Development build
npm run build

# Production optimization
npm run build && npm start
```

### Deployment Options
- **Vercel** - Recommended for Next.js
- **Netlify** - Static site deployment
- **AWS S3 + CloudFront** - Custom deployment
- **Docker** - Containerized deployment

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check `NEXT_PUBLIC_API_URL` environment variable
   - Ensure backend server is running
   - Verify CORS configuration

2. **Authentication Issues**
   - Clear browser cookies
   - Check JWT token expiration
   - Verify API endpoints

3. **Build Errors**
   - Clear `.next` folder
   - Update dependencies
   - Check TypeScript errors

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [React Hook Form](https://react-hook-form.com)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)

---

**Frontend built with modern React patterns and best practices**