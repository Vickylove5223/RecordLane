# 🚀 RecordLane Supabase Setup Guide

## ✅ **Current Status:**
- ✅ Supabase project connected: `yoccwqyrxdymrfqjpwef.supabase.co`
- ✅ All 4 Edge Functions deployed and active
- ✅ Frontend configured for production Supabase
- ⚠️ Database tables need to be created

## 🎯 **Next Steps to Complete Setup:**

### **Step 1: Create Database Tables**

1. **Go to Supabase Dashboard:**
   - Open: https://supabase.com/dashboard/project/yoccwqyrxdymrfqjpwef
   - Navigate to: SQL Editor

2. **Run the SQL Script:**
   - Copy the contents of `create-tables.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Verify Tables Created:**
   - Go to Table Editor
   - You should see `recordings` and `events` tables

### **Step 2: Configure Google OAuth (Optional)**

1. **Get Google OAuth Credentials:**
   - Go to: https://console.developers.google.com/
   - Create a new project or select existing
   - Enable YouTube Data API v3
   - Create OAuth 2.0 credentials

2. **Set Environment Variables:**
   - In Supabase Dashboard → Settings → Edge Functions
   - Add environment variables:
     - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
     - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret

### **Step 3: Start the Application**

1. **Install Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Or use the automated script:**
   ```bash
   start-production.bat
   ```

## 🧪 **Testing the Setup:**

### **Test API Endpoints:**
```bash
# Run the test script
.\test-api.bat
```

### **Manual Testing:**
1. **Health Check:**
   - URL: https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1/health
   - Should return status: "healthy"

2. **Recordings API:**
   - URL: https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1/recordings
   - Should return empty array initially

3. **Analytics API:**
   - URL: https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1/analytics
   - Should return analytics data

## 🌐 **Access Points:**

- **Frontend**: http://localhost:3000
- **Supabase Dashboard**: https://supabase.com/dashboard/project/yoccwqyrxdymrfqjpwef
- **API Base**: https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1

## 🔧 **Troubleshooting:**

### **If API returns 500 errors:**
- Database tables not created yet
- Run the SQL script in Supabase Dashboard

### **If frontend won't start:**
- Check if dependencies are installed: `cd frontend && npm install`
- Check if port 3000 is available

### **If OAuth doesn't work:**
- Verify Google OAuth credentials are set in Supabase
- Check redirect URIs in Google Console

## 📊 **API Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/functions/v1/health` | GET | Health check |
| `/functions/v1/recordings` | GET | List recordings |
| `/functions/v1/recordings` | POST | Create recording |
| `/functions/v1/analytics` | GET | Get analytics |
| `/functions/v1/auth/config` | GET | Get auth config |
| `/functions/v1/auth/google/exchange-code` | POST | Exchange OAuth code |
| `/functions/v1/auth/google/refresh-token` | POST | Refresh token |

## 🎉 **Success Indicators:**

- ✅ All API endpoints return 200 status
- ✅ Frontend loads without errors
- ✅ Database tables exist in Supabase
- ✅ OAuth flow works (if configured)

## 📞 **Need Help?**

1. Check the test results: `.\test-api.bat`
2. Check Supabase logs in the dashboard
3. Check browser console for frontend errors
4. Verify all environment variables are set

---

**Ready to go!** Once you complete Step 1 (creating the database tables), everything should work perfectly! 🚀
