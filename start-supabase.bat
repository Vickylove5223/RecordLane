@echo off
echo Starting Supabase development environment...

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Supabase CLI not found. Please install it first:
    echo npm install -g supabase
    pause
    exit /b 1
)

REM Start Supabase
echo Starting Supabase...
supabase start

REM Wait for Supabase to be ready
echo Waiting for Supabase to be ready...
timeout /t 10 /nobreak >nul

REM Check if Supabase is running
supabase status >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Supabase is running!
    echo.
    echo 📊 Supabase Studio: http://localhost:54323
    echo 🔗 API URL: http://localhost:54321
    echo 🗄️  Database: postgresql://postgres:postgres@localhost:54322/postgres
    echo.
    echo Press any key to continue...
    pause >nul
) else (
    echo ❌ Failed to start Supabase
    pause
)
