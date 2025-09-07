@echo off
echo 🚀 Starting RecordLane Frontend (Supabase Backend)...

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
echo 🎉 RecordLane Frontend is starting!
echo.
echo 📊 Frontend: http://localhost:5173
echo 🔗 Supabase API: https://yoccwqyrxdymrfqjpwef.supabase.co
echo 🗄️  Database: https://yoccwqyrxdymrfqjpwef.supabase.co/project/default
echo.
echo 📝 Note: Make sure to:
echo 1. Run create-tables.sql in your Supabase SQL Editor
echo 2. Deploy Edge Functions using deploy-supabase.bat
echo.
echo Press any key to continue...
pause >nul
