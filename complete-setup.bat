@echo off
echo 🚀 Complete RecordLane Setup...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found

REM Install dependencies
echo 📦 Installing dependencies...
npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

cd frontend
npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo ✅ Dependencies installed

echo.
echo 📋 Next Steps:
echo.
echo 1. 📊 Create Database Tables:
echo    - Go to: https://supabase.com/dashboard/project/yoccwqyrxdymrfqjpwef
echo    - Navigate to SQL Editor
echo    - Run the SQL from: add-policies-only.sql
echo    - Then run: add-user-tokens-table.sql
echo.
echo 2. 🚀 Start the Application:
echo    - Run: start-app.bat
echo    - Or manually: cd frontend && npm run dev
echo.
echo 3. 🌐 Access Your App:
echo    - Frontend: http://localhost:5173
echo    - Supabase Studio: https://yoccwqyrxdymrfqjpwef.supabase.co/project/default
echo.
echo 🎯 Features Now Available:
echo ✅ Fast startup (non-blocking)
echo ✅ Persistent YouTube authentication
echo ✅ Background Supabase sync
echo ✅ Automatic token refresh
echo ✅ Offline-first approach
echo.
echo Press any key to continue...
pause >nul
