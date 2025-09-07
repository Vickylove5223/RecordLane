@echo off
echo 🧪 Testing Supabase API Endpoints...

echo.
echo 1. Testing Health Endpoint...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1/health' -Method GET -Headers @{'Authorization'='Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvY2N3cXlyeGR5bXJmcWpwd2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDU3NzQsImV4cCI6MjA3Mjc4MTc3NH0.A-UU51XVrGN-r9OLNrF3ASf9LZXCTy3bXN0pcM9zCno'}; Write-Host '✅ Health API working - Status:' $response.status } catch { Write-Host '❌ Health API failed:' $_.Exception.Message }"

echo.
echo 2. Testing Recordings Endpoint...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1/recordings' -Method GET -Headers @{'Authorization'='Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvY2N3cXlyeGR5bXJmcWpwd2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDU3NzQsImV4cCI6MjA3Mjc4MTc3NH0.A-UU51XVrGN-r9OLNrF3ASf9LZXCTy3bXN0pcM9zCno'}; Write-Host '✅ Recordings API working - Total:' $response.total } catch { Write-Host '❌ Recordings API failed:' $_.Exception.Message }"

echo.
echo 3. Testing Analytics Endpoint...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1/analytics' -Method GET -Headers @{'Authorization'='Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvY2N3cXlyeGR5bXJmcWpwd2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDU3NzQsImV4cCI6MjA3Mjc4MTc3NH0.A-UU51XVrGN-r9OLNrF3ASf9LZXCTy3bXN0pcM9zCno'}; Write-Host '✅ Analytics API working - Total Recordings:' $response.totalRecordings } catch { Write-Host '❌ Analytics API failed:' $_.Exception.Message }"

echo.
echo 4. Testing Auth Config Endpoint...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1/auth/config' -Method GET -Headers @{'Authorization'='Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvY2N3cXlyeGR5bXJmcWpwd2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDU3NzQsImV4cCI6MjA3Mjc4MTc3NH0.A-UU51XVrGN-r9OLNrF3ASf9LZXCTy3bXN0pcM9zCno'}; Write-Host '✅ Auth API working - Client ID:' $response.clientID } catch { Write-Host '❌ Auth API failed:' $_.Exception.Message }"

echo.
echo 🎉 API Testing Complete!
echo.
echo If all tests passed, your Supabase backend is working correctly.
echo You can now start the frontend with: start-production.bat
echo.
pause
