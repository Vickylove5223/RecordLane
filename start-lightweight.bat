@echo off
echo 🚀 Starting RecordLane (Lightweight Mode)...

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

REM Replace App.tsx with lightweight version
echo 🔄 Switching to lightweight mode...
copy "frontend\App-lightweight.tsx" "frontend\App.tsx" >nul
copy "frontend\contexts\AppContext-lightweight.tsx" "frontend\contexts\AppContext.tsx" >nul
copy "frontend\contexts\YouTubeContext-lightweight.tsx" "frontend\contexts\YouTubeContext.tsx" >nul
copy "frontend\contexts\RecordingContext-lightweight.tsx" "frontend\contexts\RecordingContext.tsx" >nul

REM Start the frontend
echo 🚀 Starting frontend...
cd frontend
start "RecordLane Lightweight" cmd /k "npm run dev"
cd ..

echo.
echo 🎉 RecordLane Lightweight is starting!
echo.
echo 📊 Frontend: http://localhost:5173
echo ⚡ Mode: Lightweight (instant loading)
echo.
echo 📝 Features:
echo ✅ Instant startup (no heavy imports)
echo ✅ Lazy-loaded contexts
echo ✅ Mock services (for testing)
echo ✅ No blocking API calls
echo.
echo Press any key to continue...
pause >nul
