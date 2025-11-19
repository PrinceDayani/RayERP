# Environment Setup Guide

This guide helps you configure the environment variables for both frontend and backend to ensure proper connectivity.

## Quick Fix for Connection Issues

If you're getting "Cannot connect to backend server" errors, follow these steps:

### 1. Check Backend Configuration

The backend should be running on port **5000** (check `backend/.env`):
```env
PORT=5000
```

### 2. Update Frontend Configuration

Make sure your `frontend/.env` matches the backend port:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000

# Feature Flags
NEXT_PUBLIC_ENABLE_SOCKET=true

# Environment
NODE_ENV=development
```

### 3. Test the Connection

```bash
# From frontend directory
cd frontend
npm run test-connection
```

### 4. Validate Environment

```bash
# From frontend directory
npm run validate-env

# From backend directory
cd ../backend
npm run validate-env
```

## Environment Variables Reference

### Frontend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | `http://localhost:5000` | Backend API URL |
| `BACKEND_URL` | ⚪ | Same as API_URL | Alternative backend URL |
| `NEXT_PUBLIC_ENABLE_SOCKET` | ⚪ | `true` | Enable WebSocket connections |
| `NODE_ENV` | ⚪ | `development` | Environment mode |

### Backend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | ⚪ | `5000` | Server port |
| `MONGO_URI` | ✅ | - | MongoDB connection string |
| `JWT_SECRET` | ✅ | - | JWT signing secret |
| `CORS_ORIGIN` | ⚪ | `http://localhost:3000` | Frontend URL for CORS |

## Development Setup

### 1. Start Backend
```bash
cd backend
npm run dev
```
Backend should start on http://localhost:5000

### 2. Start Frontend
```bash
cd frontend
npm run dev
```
Frontend should start on http://localhost:3000

### 3. Verify Connection
- Open http://localhost:3000 in your browser
- Check browser console for any connection errors
- Use the connection test script: `npm run test-connection`

## Production Setup

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_ENABLE_SOCKET=true
NODE_ENV=production
```

### Backend (.env.production)
```env
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/production
JWT_SECRET=your-production-secret
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production
```

## Troubleshooting

### Common Issues

1. **Port Mismatch**: Frontend trying to connect to wrong port
   - Solution: Update `NEXT_PUBLIC_API_URL` in frontend/.env

2. **Backend Not Running**: Server not started
   - Solution: Run `npm run dev` in backend directory

3. **CORS Errors**: Backend rejecting frontend requests
   - Solution: Update `CORS_ORIGIN` in backend/.env

4. **Environment Variables Not Loading**: Variables not being read
   - Solution: Restart both servers after changing .env files

### Debug Commands

```bash
# Test backend connection
cd frontend && npm run test-connection

# Validate environment variables
cd frontend && npm run validate-env
cd backend && npm run validate-env

# Check if backend is running
curl http://localhost:5000/api/health

# Check frontend build
cd frontend && npm run build
```

## Environment File Templates

### Frontend .env Template
```env
# Copy this to frontend/.env and update values
NEXT_PUBLIC_API_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_ENABLE_SOCKET=true
NODE_ENV=development
```

### Backend .env Template
```env
# Copy this to backend/.env and update values
PORT=5000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

## Next Steps

1. ✅ Update environment files
2. ✅ Restart both servers
3. ✅ Test connection
4. ✅ Verify in browser

If you're still having issues, check the browser console and server logs for specific error messages.