# Google OAuth Setup for RecordLane

The "Connect YouTube" button is not working because Google OAuth is not configured. Here's how to fix it:

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:5173/auth/callback` (for development)
     - `https://yourdomain.com/auth/callback` (for production)
5. Copy the Client ID and Client Secret

## Step 2: Configure Supabase Environment Variables

1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions" > "Environment Variables"
3. Add the following environment variables:
   - `GOOGLE_CLIENT_ID` = your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` = your Google OAuth Client Secret

## Step 3: Test the Edge Function

The app will automatically fetch the OAuth configuration from Supabase. No local environment files needed!

## Step 4: Test Connection

1. Open the app in your browser
2. Click the Settings button
3. Click "Connect YouTube"
4. You should see a Google OAuth popup

## Troubleshooting

- Make sure the redirect URI matches exactly (including http/https)
- Ensure the YouTube Data API v3 is enabled
- Check that the Client ID is correctly set in Supabase Edge Function environment variables
- Verify the Edge Function is deployed and working
- Clear browser cache if you see cached errors
