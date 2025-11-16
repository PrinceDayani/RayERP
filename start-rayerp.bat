@echo off
echo ========================================
echo    RayERP - Secure Startup Script
echo ========================================
echo.

echo [INFO] Starting RayERP with security fixes applied...
echo.

echo [STEP 1] Checking environment files...
if not exist "backend\.env" (
    echo [WARNING] Backend .env file not found. Copying from example...
    copy "backend\.env.example" "backend\.env" >nul 2>&1
    echo [INFO] Please edit backend\.env with your actual configuration
)

if not exist "frontend\.env" (
    echo [WARNING] Frontend .env file not found. Copying from example...
    copy "frontend\.env.example" "frontend\.env" >nul 2>&1
    echo [INFO] Please edit frontend\.env with your actual configuration
)

echo [STEP 2] Creating necessary directories...
if not exist "backend\uploads" mkdir "backend\uploads"
if not exist "backend\uploads\journal-entries" mkdir "backend\uploads\journal-entries"
if not exist "backend\uploads\projects" mkdir "backend\uploads\projects"
if not exist "backend\uploads\chat" mkdir "backend\uploads\chat"
if not exist "backend\logs" mkdir "backend\logs"

echo [STEP 3] Starting backend server...
cd backend
start "RayERP Backend" cmd /k "npm run dev"
cd ..

echo [STEP 4] Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo [STEP 5] Starting frontend server...
cd frontend
start "RayERP Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo    RayERP Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Security Features Enabled:
echo ✓ Environment variables secured
echo ✓ Input validation middleware
echo ✓ CSRF protection
echo ✓ File upload security
echo ✓ Authentication & authorization
echo ✓ Security headers configured
echo.
echo Press any key to exit...
pause >nul