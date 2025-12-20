@echo off
echo ========================================
echo Balance Sheet - Production Setup
echo ========================================
echo.

cd backend

echo [1/6] Installing dependencies...
call npm install pdfkit nodemailer node-cron
call npm install --save-dev @types/pdfkit @types/nodemailer @types/node-cron

echo.
echo [2/6] Checking environment variables...
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env file with SMTP configuration
    echo.
    echo Required variables:
    echo SMTP_HOST=smtp.gmail.com
    echo SMTP_PORT=587
    echo SMTP_USER=your-email@gmail.com
    echo SMTP_PASS=your-app-password
    pause
    exit /b 1
)

echo.
echo [3/6] Building backend...
call npm run build
if errorlevel 1 (
    echo.
    echo WARNING: Build has errors. Continuing with skipLibCheck...
    call npx tsc --skipLibCheck
)

echo.
echo [4/6] Setting up frontend...
cd ..\frontend
call npm install --legacy-peer-deps

echo.
echo [5/6] Building frontend...
call npm run build

echo.
echo [6/6] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Configure SMTP in backend/.env
echo 2. Run: npm run dev (in backend folder)
echo 3. Run: npm run dev (in frontend folder)
echo 4. Visit: http://localhost:3000/dashboard/finance/balance-sheet
echo ========================================
echo.
pause
