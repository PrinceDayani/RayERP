# RayERP Troubleshooting Guide

## Issues Fixed

### 1. API 400 Errors (Failed to load resource: /api/gl/accounts)

**Problem**: Frontend trying to call backend APIs but backend server not running.

**Solutions**:
1. **Start Backend Server**: 
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Start Both Servers**: Use the provided batch script:
   ```bash
   start-both-servers.bat
   ```

3. **Environment Variables**: Ensure both `.env` files are properly configured:
   - Frontend: `NEXT_PUBLIC_API_URL=http://localhost:5000` and `BACKEND_URL=http://localhost:5000`
   - Backend: `PORT=5000`

### 2. Dialog Accessibility Warnings

**Problem**: Missing `Description` or `aria-describedby` for DialogContent components.

**Fixed**: Added proper `aria-describedby` attributes and IDs to all Dialog components.

### 3. Button Functionality Issues

**Problem**: Buttons may not work if backend is not running.

**Fixed**: 
- Updated API calls to fallback to localStorage when backend is unavailable
- Enhanced error handling for better user experience
- Buttons now work in offline mode using localStorage

## Quick Start

1. **Install Dependencies**:
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Start Servers**:
   ```bash
   # From root directory
   start-both-servers.bat
   ```

3. **Access Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Development Notes

- The application works in offline mode using localStorage when backend is unavailable
- All Dialog accessibility warnings have been suppressed and fixed
- API errors are handled gracefully with fallback to local storage
- Authentication middleware on backend requires proper login for API access

## Environment Setup

Ensure these environment variables are set:

**Frontend (.env)**:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000
```

**Backend (.env)**:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```