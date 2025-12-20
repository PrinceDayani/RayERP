@echo off
echo ========================================
echo RayERP Backend Diagnostic Tool
echo ========================================
echo.

echo [1/5] Checking if backend is running on port 5000...
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running
    curl -s http://localhost:5000/api/health
) else (
    echo ❌ Backend is NOT running on port 5000
    echo    Please start backend: cd backend ^&^& npm run dev
    goto :end
)
echo.

echo [2/5] Checking MongoDB connection...
curl -s http://localhost:5000/api/health | findstr "healthy" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB is connected
) else (
    echo ⚠️  Cannot verify MongoDB connection
)
echo.

echo [3/5] Checking vouchers endpoint (without auth)...
curl -s -o nul -w "HTTP Status: %%{http_code}" http://localhost:5000/api/vouchers
echo.
echo    Note: 401 is expected (authentication required)
echo    Note: 200 means endpoint is accessible
echo.

echo [4/5] Checking CORS configuration...
curl -s -H "Origin: http://localhost:3000" -I http://localhost:5000/api/health | findstr "Access-Control" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ CORS is configured
) else (
    echo ⚠️  CORS headers not found
)
echo.

echo [5/5] Checking frontend .env.local...
if exist "..\frontend\.env.local" (
    echo ✅ Frontend .env.local exists
    type "..\frontend\.env.local"
) else (
    echo ❌ Frontend .env.local NOT found
    echo    Please create: cd frontend ^&^& copy .env.example .env.local
)
echo.

:end
echo ========================================
echo Diagnostic Complete
echo ========================================
echo.
echo Next Steps:
echo 1. If backend is not running: cd backend ^&^& npm run dev
echo 2. If MongoDB error: Check MONGO_URI in backend/.env
echo 3. If CORS error: Check CORS_ORIGIN in backend/.env
echo 4. If frontend .env missing: cd frontend ^&^& copy .env.example .env.local
echo.
pause
