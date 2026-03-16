# RayERP - Technology Stack

## Programming Languages

### Backend
- **TypeScript 5.0.2** - Primary language for type-safe backend development
- **JavaScript** - Migration scripts and utilities

### Frontend
- **TypeScript 5.x** - Primary language for type-safe frontend development
- **JavaScript** - Configuration files

### Mobile
- **Dart** - Flutter mobile application

## Backend Technologies

### Core Framework
- **Node.js 22.x** - JavaScript runtime
- **Express.js 4.21.2** - Web application framework
- **TypeScript 5.0.2** - Type safety and modern JavaScript features

### Database
- **MongoDB 7.2.0** - NoSQL database
- **Mongoose 7.2.0** - MongoDB ODM with schema validation

### Real-Time Communication
- **Socket.IO 4.8.1** - Bidirectional event-based communication

### Authentication & Security
- **jsonwebtoken 9.0.2** - JWT token generation and verification
- **bcryptjs 2.4.3** - Password hashing
- **helmet 7.0.0** - Security headers
- **cors 2.8.5** - Cross-origin resource sharing
- **express-rate-limit 6.11.2** - Rate limiting
- **express-validator 7.3.0** - Input validation

### File Handling
- **multer 2.0.2** - File upload middleware
- **sharp 0.34.5** - Image processing
- **archiver 7.0.1** - File compression
- **adm-zip 0.5.16** - ZIP file handling

### Document Generation
- **pdfkit 0.13.0** - PDF generation
- **jspdf 3.0.3** - Client-side PDF generation
- **json2csv 6.0.0** - CSV export
- **ical-generator 10.0.0** - Calendar file generation

### Utilities
- **axios 1.13.2** - HTTP client
- **dotenv 16.0.3** - Environment variable management
- **winston 3.8.2** - Logging
- **node-cron 4.2.1** - Task scheduling
- **nodemailer 7.0.11** - Email sending
- **compression 1.8.1** - Response compression
- **cookie-parser 1.4.7** - Cookie parsing

### Development Tools
- **nodemon 3.1.11** - Auto-restart on file changes
- **ts-node 10.9.2** - TypeScript execution
- **eslint 8.41.0** - Code linting
- **@typescript-eslint** - TypeScript ESLint rules

## Frontend Technologies

### Core Framework
- **Next.js 16.0.3** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.x** - Type safety

### UI Components
- **Shadcn/ui** - Component library built on Radix UI
- **Radix UI** - Unstyled, accessible components
  - Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu
  - Label, Popover, Progress, Radio Group, Scroll Area
  - Select, Separator, Slider, Slot, Switch, Tabs, Toast, Tooltip
- **Lucide React 0.476.0** - Icon library
- **Framer Motion 12.23.12** - Animation library

### Styling
- **Tailwind CSS 3.3.0** - Utility-first CSS framework
- **tailwindcss-animate 1.0.7** - Animation utilities
- **tailwind-merge 3.0.2** - Class name merging
- **class-variance-authority 0.7.1** - Variant management
- **clsx 2.1.1** - Conditional class names

### State Management
- **@tanstack/react-query 5.90.12** - Server state management
- **React Context** - Global state management
- **React Hook Form 7.62.0** - Form state management
- **Zod 3.24.2** - Schema validation

### Data Visualization
- **Chart.js 4.5.1** - Chart library
- **react-chartjs-2 5.3.1** - React wrapper for Chart.js
- **Recharts 2.15.4** - Composable chart library

### Real-Time Communication
- **socket.io-client 4.8.1** - Socket.IO client

### HTTP Client
- **axios 1.12.0** - Promise-based HTTP client

### Utilities
- **date-fns 3.6.0** - Date manipulation
- **js-cookie 3.0.5** - Cookie handling
- **cmdk 1.0.0** - Command menu
- **next-themes 0.4.6** - Theme management
- **sonner 2.0.7** - Toast notifications
- **react-hot-toast 2.6.0** - Toast notifications

### File Handling
- **file-saver 2.0.5** - File download
- **papaparse 5.5.2** - CSV parsing
- **xlsx 0.18.5** - Excel file handling
- **jspdf 3.0.3** - PDF generation
- **html2canvas 1.4.1** - Screenshot generation
- **react-pdf 10.2.0** - PDF viewing
- **qrcode 1.5.4** - QR code generation

### Development Tools
- **eslint 9** - Code linting
- **eslint-config-next 15.1.7** - Next.js ESLint config
- **autoprefixer 10.4.20** - CSS vendor prefixes
- **postcss 8.5.3** - CSS processing
- **@next/bundle-analyzer 15.1.7** - Bundle analysis

## Mobile Technologies

### Framework
- **Flutter** - Cross-platform mobile framework
- **Dart** - Programming language

## Build Systems & Tools

### Backend Build
```json
"scripts": {
  "dev": "nodemon --exec ts-node --transpile-only src/server.ts",
  "build": "tsc --skipLibCheck",
  "build:prod": "tsc -p tsconfig.prod.json",
  "start": "node dist/server.js",
  "start:prod": "NODE_ENV=production node dist/server.js"
}
```

### Frontend Build
```json
"scripts": {
  "dev": "next dev --turbo",
  "build": "next build",
  "build:prod": "NODE_ENV=production next build",
  "start": "next start",
  "start:prod": "NODE_ENV=production next start"
}
```

## Development Commands

### Backend Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:prod

# Start production server
npm run start:prod

# Run database migrations
npm run migrate:roles
npm run migrate:accounts

# Seed database
npm run seed
npm run seed:accounts
```

### Frontend Development
```bash
# Install dependencies (with legacy peer deps for compatibility)
npm install --legacy-peer-deps

# Start development server with Turbo
npm run dev

# Build for production
npm run build:prod

# Start production server
npm start:prod

# Type checking
npm run type-check

# Linting
npm run lint
```

## Environment Configuration

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

## Deployment

### Docker
- **docker-compose.yml** - Multi-container orchestration
- **Dockerfile** - Container definitions for backend and frontend
- **docker-compose.backend.yml** - Backend-specific configuration
- **docker-compose.frontend.yml** - Frontend-specific configuration

### Production Requirements
- **Node.js**: 22.x (managed via Volta)
- **npm**: >=10.0.0
- **MongoDB**: 7.x or compatible cloud instance
- **Memory**: Minimum 2GB RAM recommended
- **Storage**: Adequate space for uploads and logs

## Version Management
- **Volta** - Node.js version manager
  - Node: 22.11.0
  - npm: 10.9.0

## Package Management
- **npm** - Primary package manager (enforced via preinstall script)
- **--legacy-peer-deps** - Required for frontend due to peer dependency conflicts

## Code Quality Tools

### Linting
- ESLint with TypeScript support
- Next.js ESLint configuration
- Custom rules for code consistency

### Type Checking
- TypeScript strict mode
- Incremental compilation
- Skip lib check for faster builds

### Testing
- Test files in `backend/src/__tests__/`
- Test utilities in `backend/tests/`

## Performance Optimization

### Backend
- Compression middleware for response size reduction
- Database indexes for query optimization
- Caching with node-cache
- Aggregation pipelines for complex queries

### Frontend
- Next.js Turbo mode for faster development
- Code splitting and lazy loading
- Image optimization with Next.js Image
- Bundle analysis for size monitoring
- React Query for efficient data fetching and caching
