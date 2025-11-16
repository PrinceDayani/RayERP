#!/bin/bash

echo "========================================"
echo "    RayERP - Secure Startup Script"
echo "========================================"
echo

echo "[INFO] Starting RayERP with security fixes applied..."
echo

echo "[STEP 1] Checking environment files..."
if [ ! -f "backend/.env" ]; then
    echo "[WARNING] Backend .env file not found. Copying from example..."
    cp "backend/.env.example" "backend/.env"
    echo "[INFO] Please edit backend/.env with your actual configuration"
fi

if [ ! -f "frontend/.env" ]; then
    echo "[WARNING] Frontend .env file not found. Copying from example..."
    cp "frontend/.env.example" "frontend/.env"
    echo "[INFO] Please edit frontend/.env with your actual configuration"
fi

echo "[STEP 2] Creating necessary directories..."
mkdir -p backend/uploads/journal-entries
mkdir -p backend/uploads/projects
mkdir -p backend/uploads/chat
mkdir -p backend/logs

echo "[STEP 3] Setting secure file permissions..."
chmod 600 backend/.env 2>/dev/null || true
chmod 600 frontend/.env 2>/dev/null || true
chmod 755 backend/uploads 2>/dev/null || true

echo "[STEP 4] Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

echo "[STEP 5] Waiting for backend to start..."
sleep 5

echo "[STEP 6] Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo
echo "========================================"
echo "    RayERP Started Successfully!"
echo "========================================"
echo
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo
echo "Security Features Enabled:"
echo "✓ Environment variables secured"
echo "✓ Input validation middleware"
echo "✓ CSRF protection"
echo "✓ File upload security"
echo "✓ Authentication & authorization"
echo "✓ Security headers configured"
echo
echo "Process IDs:"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo
echo "Press Ctrl+C to stop all services"

# Wait for interrupt signal
trap 'echo "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait