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
- **Inventory Management** - Products, stock tracking, alerts
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

- **CONSOLIDATED_DOCUMENTATION.md** - Complete system documentation
- **PRODUCTION_READY.md** - Production deployment guide
- **SECURITY_GUIDE.md** - Security implementation details

## 🔒 Security Features

- JWT authentication with role-based access control
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Security headers
- XSS and injection protection

## 🐛 Troubleshooting

1. **Connection Issues**: Check environment variables
2. **Build Errors**: Clear cache and reinstall dependencies
3. **Database Issues**: Verify MongoDB connection
4. **Port Conflicts**: Ensure ports 3000/5000 are available

## 📞 Support

For issues or questions, check the logs:
- Backend: `backend/logs/`
- Frontend: Browser console

---

**RayERP - Complete Enterprise Resource Planning System**
**Status**: Production Ready ✅
**Version**: 2.0.0