@echo off
echo Starting RayERP Development Servers...

echo.
echo 1. Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm run dev"

echo.
echo 2. Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo 3. Starting Frontend Server...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo 4. Testing connection...
timeout /t 3 /nobreak > nul
cd ..
node test-cors-fix.js

echo.
echo Both servers should be starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause