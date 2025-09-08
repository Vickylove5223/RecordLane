@echo off
echo 🚀 Pushing all updates to GitHub...
echo.

echo 📋 Checking git status...
git status
echo.

echo 📦 Adding all changes...
git add .
echo.

echo 💾 Committing changes...
git commit -m "fix: Improve Supabase integration and remove warnings

- Fix Supabase configuration warning message
- Update AppContext to load recordings from Supabase instead of local storage
- Add proper error handling with fallback to local storage
- Remove 'Ready to make the switch?' section from comparison table
- Switch to Supabase Edge Functions for YouTube OAuth
- Create SupabaseYouTubeService to use Edge Functions
- Update all components to use SupabaseYouTubeService
- Fix recording modal issues and remove Record button during recording"
echo.

echo 🚀 Pushing to main branch...
git push origin main
echo.

echo ✅ Done! All updates have been pushed to GitHub.
pause
