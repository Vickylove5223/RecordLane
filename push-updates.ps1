Write-Host "🚀 Pushing all updates to GitHub..." -ForegroundColor Green
Write-Host ""

Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status
Write-Host ""

Write-Host "📦 Adding all changes..." -ForegroundColor Yellow
git add .
Write-Host ""

Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "fix: Improve Supabase integration and remove warnings

- Fix Supabase configuration warning message
- Update AppContext to load recordings from Supabase instead of local storage
- Add proper error handling with fallback to local storage
- Remove 'Ready to make the switch?' section from comparison table
- Switch to Supabase Edge Functions for YouTube OAuth
- Create SupabaseYouTubeService to use Edge Functions
- Update all components to use SupabaseYouTubeService
- Fix recording modal issues and remove Record button during recording"
Write-Host ""

Write-Host "🚀 Pushing to main branch..." -ForegroundColor Yellow
git push origin main
Write-Host ""

Write-Host "✅ Done! All updates have been pushed to GitHub." -ForegroundColor Green
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
