@echo off
echo Fixing Voucher Error...
echo.

cd backend

echo Updating .env file...
powershell -Command "(Get-Content .env) -replace 'FRONTEND_URL=http://localhost:3001', 'FRONTEND_URL=http://localhost:3000' | Set-Content .env"

echo.
echo Fixed! Now restart your backend server:
echo   cd backend
echo   npm run dev
echo.
pause
