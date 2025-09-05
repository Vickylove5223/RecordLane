# YouTube Integration Setup Guide

This guide will help you set up the real YouTube integration for RecordLane.

## Prerequisites

1. **Google Cloud Console Account**
2. **Encore.ts Backend Running** (Port 4000)
3. **Frontend Development Server** (Port 8089)

## Step 1: Google Cloud Console Setup

### 1.1 Create OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select **"Web application"** as the application type
6. Give it a name (e.g., "RecordLane Web Client")

### 1.2 Configure Authorized Redirect URIs
Add these redirect URIs:
```
http://localhost:8089/auth/callback
http://localhost:4000/auth/callback
https://your-app-url.lp.dev/auth/callback
```

### 1.3 Enable YouTube Data API v3
1. Go to "APIs & Services" > "Library"
2. Search for "YouTube Data API v3"
3. Click on it and press "Enable"

### 1.4 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: RecordLane
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
4. Add scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.force-ssl`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

## Step 2: Backend Configuration

### 2.1 Set Encore Secrets
In your Encore dashboard or using the CLI:

```bash
encore secret set --type=prod GoogleClientID "your-client-id-here"
encore secret set --type=prod GoogleClientSecret "your-client-secret-here"
```

### 2.2 Start Backend Server
```bash
cd backend
encore run
```

The backend should be running on `http://localhost:4000`

## Step 3: Frontend Configuration

### 3.1 Environment Variables
Create a `.env` file in the frontend directory:
```env
VITE_CLIENT_TARGET=http://localhost:4000
NODE_ENV=development
```

### 3.2 Start Frontend Server
```bash
cd frontend
npm run dev
```

The frontend should be running on `http://localhost:8089`

## Step 4: Test the Integration

### 4.1 Test Connection
1. Open `http://localhost:8089`
2. Click "Connect YouTube"
3. Complete the OAuth flow
4. Verify you're connected

### 4.2 Test Upload
1. Record a video
2. Try uploading to YouTube
3. Check your YouTube channel for the uploaded video

## Troubleshooting

### Common Issues

**1. "OAuth configuration not available"**
- Ensure backend is running on port 4000
- Check that secrets are set correctly
- Verify frontend can reach backend

**2. "Token exchange failed"**
- Check redirect URI matches exactly
- Verify client ID and secret are correct
- Ensure YouTube Data API v3 is enabled

**3. "Upload failed"**
- Check that user has granted upload permissions
- Verify video file is valid
- Check network connectivity

**4. "Popup blocked"**
- Allow popups for localhost:8089
- Try the connection again

### Debug Mode

To enable debug logging, set in `frontend/config.ts`:
```typescript
export const DEV_CONFIG = {
  enableDebugLogs: true,
  // ... other config
};
```

### Fallback to Demo Mode

If you need to test without real YouTube integration, set:
```typescript
export const DEV_CONFIG = {
  mockAPI: true, // Enable demo mode
  // ... other config
};
```

## API Endpoints

The backend provides these endpoints:

- `GET /auth/config` - Get OAuth configuration
- `POST /auth/google/exchange-code` - Exchange OAuth code for tokens
- `POST /auth/google/refresh-token` - Refresh access token

## Security Notes

- Never commit client secrets to version control
- Use environment variables for production
- Regularly rotate OAuth credentials
- Monitor API usage in Google Cloud Console

## Production Deployment

For production deployment:

1. Update redirect URIs to include production URLs
2. Set production secrets in Encore
3. Update `VITE_CLIENT_TARGET` to production backend URL
4. Ensure HTTPS is used for OAuth redirects

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify backend logs
3. Check Google Cloud Console for API errors
4. Ensure all URLs match exactly (no trailing slashes, correct ports)
