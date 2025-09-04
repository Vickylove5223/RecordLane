# Google OAuth Setup for RecordLane

This guide will help you configure Google OAuth for YouTube integration in RecordLane.

## Current Client ID
Your current Google Client ID is: `104046752889-schirpg4cp1ckr4i587dmc97qhlkmjnt.apps.googleusercontent.com`

## Required Google Cloud Console Configuration

### 1. Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"

### 2. Configure OAuth Application
1. Find your OAuth 2.0 Client ID: `104046752889-schirpg4cp1ckr4i587dmc97qhlkmjnt.apps.googleusercontent.com`
2. Click on it to edit

### 3. **CRITICAL: Change Application Type**
1. In the "Application type" section, select **"Single Page Application (SPA)"**
2. **DO NOT** use "Web application" - this requires a client secret which causes the errors you're seeing

### 4. Configure Authorized JavaScript Origins
Add these origins:
```
http://localhost:8089
http://127.0.0.1:8089
https://loom-clone-d2qv2u482vjq7vcc59sg.lp.dev
https://recordlane.com
```

### 5. Configure Authorized Redirect URIs
Add these redirect URIs:
```
http://localhost:8089/auth/callback
http://127.0.0.1:8089/auth/callback
https://loom-clone-d2qv2u482vjq7vcc59sg.lp.dev/auth/callback
https://recordlane.com/auth/callback
```

### 6. Enable YouTube Data API v3
1. Go to "APIs & Services" > "Library"
2. Search for "YouTube Data API v3"
3. Click on it and press "Enable"

### 7. Configure OAuth Consent Screen
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

## Why This Fixes the Issue

The error "client_secret is missing" occurs because:
1. Your OAuth application is configured as "Web application" which requires a client secret
2. RecordLane uses PKCE (Proof Key for Code Exchange) which is designed for single-page applications
3. PKCE doesn't use client secrets for security - it uses code verifiers instead

By changing to "Single Page Application" type:
- No client secret is required
- PKCE flow works correctly
- The OAuth popup will work without COOP errors

## Testing the Fix

After making these changes:
1. Save the configuration in Google Cloud Console
2. Wait 5-10 minutes for changes to propagate
3. Clear your browser cache and cookies
4. Try connecting to YouTube again in RecordLane

## Troubleshooting

If you still see errors:
1. Check that the redirect URI exactly matches what's in Google Console
2. Ensure the YouTube Data API v3 is enabled
3. Verify the OAuth consent screen is properly configured
4. Check browser console for any remaining errors

## Security Notes

- Never commit client secrets to version control
- Use environment variables for production configurations
- Regularly rotate OAuth credentials
- Monitor API usage in Google Cloud Console
