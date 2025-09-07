# 🔐 Google OAuth Setup Guide for RecordLane

## 🎯 **Current Status:**
- ✅ Supabase backend is working
- ✅ Frontend is running on http://localhost:5173
- ⚠️ Google OAuth credentials need to be configured

## 📋 **Step-by-Step OAuth Setup:**

### **Step 1: Create Google Cloud Project**

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Click "Select a project" → "New Project"
   - Name: "RecordLane" (or any name you prefer)
   - Click "Create"

### **Step 2: Enable YouTube Data API**

1. **Navigate to APIs & Services:**
   - In the Google Cloud Console, go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click on it and press "Enable"

### **Step 3: Create OAuth 2.0 Credentials**

1. **Go to Credentials:**
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"

2. **Configure OAuth Consent Screen:**
   - If prompted, click "Configure Consent Screen"
   - Choose "External" user type
   - Fill in required fields:
     - App name: "RecordLane"
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue" through all steps

3. **Create OAuth Client:**
   - Application type: "Web application"
   - Name: "RecordLane Web Client"
   - Authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - `https://yourdomain.com` (for production)
   - Click "Create"

4. **Copy Credentials:**
   - Copy the **Client ID** and **Client Secret**
   - Keep these safe - you'll need them for Supabase

### **Step 4: Configure Supabase Environment Variables**

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/yoccwqyrxdymrfqjpwef
   - Navigate to "Settings" → "Edge Functions"

2. **Add Environment Variables:**
   - Click "Add new secret"
   - Name: `GOOGLE_CLIENT_ID`
   - Value: Your Google OAuth Client ID
   - Click "Add new secret" again
   - Name: `GOOGLE_CLIENT_SECRET`
   - Value: Your Google OAuth Client Secret

### **Step 5: Test OAuth Configuration**

1. **Open the OAuth Test Page:**
   - Go to: http://localhost:5173/test-oauth.html
   - Click "Test Auth Config"
   - You should see: "✅ Auth Config Working! Client ID: your_client_id"

2. **Test OAuth Flow:**
   - Click "Test OAuth Flow"
   - Should show credentials are configured properly

## 🧪 **Testing the Complete Flow:**

### **Test 1: OAuth Configuration**
```bash
# Test the auth config endpoint
curl -X GET "https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1/auth/config"
```

**Expected Response:**
```json
{
  "clientID": "your_google_client_id_here"
}
```

### **Test 2: Frontend Integration**
1. Open http://localhost:5173
2. Try to connect YouTube account
3. Should redirect to Google OAuth
4. After authorization, should return to app

## 🔧 **Troubleshooting:**

### **If Auth Config returns empty Client ID:**
- Check if `GOOGLE_CLIENT_ID` is set in Supabase Edge Functions
- Make sure the environment variable name is exactly `GOOGLE_CLIENT_ID`

### **If OAuth flow fails:**
- Verify `GOOGLE_CLIENT_SECRET` is set in Supabase
- Check that redirect URI matches exactly: `http://localhost:5173`
- Ensure YouTube Data API v3 is enabled

### **If you get CORS errors:**
- The Edge Functions already have CORS headers configured
- Check browser console for specific error messages

## 📊 **Expected Behavior After Setup:**

1. **User clicks "Connect YouTube":**
   - Redirects to Google OAuth consent screen
   - User authorizes the app
   - Returns to RecordLane with access token

2. **OAuth tokens are stored:**
   - Access token for API calls
   - Refresh token for token renewal
   - User can now upload videos to YouTube

3. **YouTube integration works:**
   - Can upload recordings to YouTube
   - Can manage video settings
   - Can view upload status

## 🎉 **Success Indicators:**

- ✅ Auth config returns your Client ID
- ✅ OAuth test page shows green checkmarks
- ✅ Frontend can initiate OAuth flow
- ✅ User can successfully connect YouTube account
- ✅ YouTube upload functionality works

---

**Once you complete these steps, your RecordLane app will have full YouTube integration!** 🚀
