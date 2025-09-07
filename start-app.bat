@echo off
echo 🚀 Starting RecordLane Application...

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

REM Start the frontend
echo 🚀 Starting frontend...
cd frontend
start "RecordLane Frontend" cmd /k "npm run dev"
cd ..

echo.
echo 🎉 RecordLane is starting!
echo.
echo 📊 Frontend: http://localhost:5173
echo 🔗 Supabase API: https://yoccwqyrxdymrfqjpwef.supabase.co
echo 🗄️  Database: https://yoccwqyrxdymrfqjpwef.supabase.co/project/default
echo.
echo 📝 Note: The app now loads instantly with:
echo - No preloader (instant startup)
echo - Persistent YouTube authentication
echo - Background Supabase sync
echo.
echo Press any key to continue...
pause >nul
