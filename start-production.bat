@echo off
echo ========================================
echo    RayERP - Production Startup
echo ========================================
echo.

echo [INFO] Starting RayERP in production mode...
echo.

echo [STEP 1] Building backend...
cd backend
call npm run build:prod
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed!
    pause
    exit /b 1
)

echo [STEP 2] Building frontend...
cd ..\frontend
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b 1
)

echo [STEP 3] Starting production servers...
cd ..\backend
start "RayERP Backend (Production)" cmd /k "npm run start:prod"

cd ..\frontend
start "RayERP Frontend (Production)" cmd /k "npm start"

echo.
echo ========================================
echo    RayERP Production Started!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul