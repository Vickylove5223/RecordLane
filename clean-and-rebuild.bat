@echo off
echo 🧹 Cleaning and rebuilding RecordLane...

REM Clean dist folder
if exist "frontend\dist" (
    echo 🗑️ Removing old build files...
    rmdir /s /q "frontend\dist"
    echo ✅ Old build files removed
)

REM Clean node_modules cache
if exist "frontend\node_modules\.vite" (
    echo 🗑️ Clearing Vite cache...
    rmdir /s /q "frontend\node_modules\.vite"
    echo ✅ Vite cache cleared
)

REM Rebuild the project
echo 🔨 Rebuilding project...
cd frontend
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Build completed successfully!
echo.
echo 🚀 Performance monitoring code removed!
echo 📦 Fresh build created without performance overhead
echo.
echo To start the app, run: start-app.bat
pause
