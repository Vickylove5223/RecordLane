@echo off
echo 🚀 Starting RecordLane (Fast Mode - No Performance Monitoring)...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found

REM Install frontend dependencies if needed
if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Frontend dependencies installed
) else (
    echo ✅ Frontend dependencies already installed
)

REM Clean and rebuild to remove performance monitoring
echo 🧹 Cleaning old build...
if exist "frontend\dist" rmdir /s /q "frontend\dist"
if exist "frontend\node_modules\.vite" rmdir /s /q "frontend\node_modules\.vite"

REM Start the frontend
echo 🚀 Starting frontend (fast mode)...
cd frontend
start "RecordLane Fast" cmd /k "npm run dev"
cd ..

echo.
echo 🎉 RecordLane is starting in FAST MODE!
echo.
echo 📊 Frontend: http://localhost:5173
echo ⚡ Mode: Fast (no performance monitoring)
echo.
echo 🚀 Performance improvements:
echo ✅ Removed performance monitoring overhead
echo ✅ Cleaned build cache
echo ✅ No heavy imports on startup
echo.
echo Press any key to continue...
pause >nul
