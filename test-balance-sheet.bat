@echo off
echo ========================================
echo Balance Sheet - Feature Test
echo ========================================
echo.

echo Testing Backend...
echo.

echo [1/8] Testing Balance Sheet API...
curl -s http://localhost:5000/api/finance/reports/balance-sheet?asOfDate=2024-01-31 > nul
if errorlevel 1 (
    echo ❌ FAIL: Balance Sheet API not responding
) else (
    echo ✅ PASS: Balance Sheet API working
)

echo.
echo [2/8] Testing Health Check...
curl -s http://localhost:5000/api/health > nul
if errorlevel 1 (
    echo ❌ FAIL: Health check failed
) else (
    echo ✅ PASS: Health check working
)

echo.
echo [3/8] Checking if scheduler is running...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ PASS: Node process running
) else (
    echo ❌ FAIL: Node process not found
)

echo.
echo [4/8] Checking environment variables...
if exist backend\.env (
    echo ✅ PASS: .env file exists
    findstr /C:"SMTP_HOST" backend\.env >nul
    if errorlevel 1 (
        echo ⚠️  WARN: SMTP_HOST not configured
    ) else (
        echo ✅ PASS: SMTP configured
    )
) else (
    echo ❌ FAIL: .env file missing
)

echo.
echo [5/8] Checking dependencies...
if exist backend\node_modules\pdfkit (
    echo ✅ PASS: pdfkit installed
) else (
    echo ❌ FAIL: pdfkit not installed
)

if exist backend\node_modules\nodemailer (
    echo ✅ PASS: nodemailer installed
) else (
    echo ❌ FAIL: nodemailer not installed
)

if exist backend\node_modules\node-cron (
    echo ✅ PASS: node-cron installed
) else (
    echo ❌ FAIL: node-cron not installed
)

echo.
echo [6/8] Checking models...
if exist backend\src\models\ReportSchedule.ts (
    echo ✅ PASS: ReportSchedule model exists
) else (
    echo ❌ FAIL: ReportSchedule model missing
)

if exist backend\src\models\AccountNote.ts (
    echo ✅ PASS: AccountNote model exists
) else (
    echo ❌ FAIL: AccountNote model missing
)

echo.
echo [7/8] Checking controllers...
if exist backend\src\controllers\reportScheduleController.ts (
    echo ✅ PASS: reportScheduleController exists
) else (
    echo ❌ FAIL: reportScheduleController missing
)

echo.
echo [8/8] Checking utilities...
if exist backend\src\utils\pdfGenerator.ts (
    echo ✅ PASS: pdfGenerator exists
) else (
    echo ❌ FAIL: pdfGenerator missing
)

if exist backend\src\utils\scheduler.ts (
    echo ✅ PASS: scheduler exists
) else (
    echo ❌ FAIL: scheduler missing
)

echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
echo If all tests pass, your Balance Sheet is ready!
echo If any tests fail, run: setup-balance-sheet.bat
echo.
pause
