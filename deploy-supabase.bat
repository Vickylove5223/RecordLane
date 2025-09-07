@echo off
echo 🚀 Deploying Supabase Edge Functions...

REM Check if Supabase CLI is available
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI not found. Installing...
    npm install -g supabase
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install Supabase CLI
        pause
        exit /b 1
    )
)

echo ✅ Supabase CLI found

REM Login to Supabase (if not already logged in)
echo 🔐 Logging into Supabase...
supabase login
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to login to Supabase
    pause
    exit /b 1
)

REM Link to your project
echo 🔗 Linking to project...
supabase link --project-ref yoccwqyrxdymrfqjpwef
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to link to project
    pause
    exit /b 1
)

REM Deploy Edge Functions
echo 📦 Deploying Edge Functions...
supabase functions deploy
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to deploy Edge Functions
    pause
    exit /b 1
)

echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📊 Your Edge Functions are now available at:
echo 🔗 Health: https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1/health
echo 🔗 Recordings: https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1/recordings
echo 🔗 Analytics: https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1/analytics
echo 🔗 Auth: https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1/auth
echo.
echo 📝 Don't forget to run the create-tables.sql in your Supabase SQL Editor!
echo.
pause
