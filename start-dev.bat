@echo off
echo ========================================
echo RayERP Quick Start
echo ========================================
echo.

echo Starting Backend Server...
echo.
start cmd /k "cd backend && echo Starting Backend... && npm run dev"

timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
echo.
start cmd /k "cd frontend && echo Starting Frontend... && npm run dev"

echo.
echo ========================================
echo Servers Starting...
echo ========================================
echo.
echo Backend will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:3000
echo.
echo Wait 10-15 seconds for servers to fully start
echo Then open: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
