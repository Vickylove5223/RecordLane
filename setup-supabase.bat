@echo off
echo 🚀 Setting up RecordLane with Supabase...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm not found. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install Supabase CLI globally
echo 📦 Installing Supabase CLI...
npm install -g supabase
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install Supabase CLI
    pause
    exit /b 1
)

echo ✅ Supabase CLI installed

REM Install project dependencies
echo 📦 Installing project dependencies...
npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install project dependencies
    pause
    exit /b 1
)

echo ✅ Project dependencies installed

REM Install frontend dependencies
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

REM Start Supabase
echo 🚀 Starting Supabase...
supabase start
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to start Supabase
    pause
    exit /b 1
)

echo.
echo 🎉 Setup complete!
echo.
echo 📊 Supabase Studio: http://localhost:54323
echo 🔗 API URL: http://localhost:54321
echo 🗄️  Database: postgresql://postgres:postgres@localhost:54322/postgres
echo.
echo 🚀 To start the frontend, run:
echo    cd frontend
echo    npm run dev
echo.
echo Press any key to continue...
pause >nul
