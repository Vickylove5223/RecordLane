# YouTube Integration Setup Guide

This guide will help you set up YouTube integration for your RecordLane instance. The integration allows you to automatically upload your screen recordings to YouTube.

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vickylove5223/RecordLane.git
   cd RecordLane
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up YouTube API credentials** (see detailed steps below)

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the app** at `http://localhost:8089` and click "Setup YouTube" in the header

## Detailed Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "RecordLane YouTube Integration")
5. Click "Create"

### Step 2: Enable YouTube Data API

1. In your Google Cloud project, go to "APIs & Services" → "Library"
2. Search for "YouTube Data API v3"
3. Click on "YouTube Data API v3"
4. Click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in the required fields (App name, User support email, Developer email)
   - Add your domain to authorized domains
   - Add scopes: `../auth/youtube.upload`, `../auth/userinfo.email`
4. For Application type, choose "Single Page Application (SPA)"
5. Add authorized redirect URIs: `http://localhost:8089/auth/callback`
6. Click "Create"
7. Copy the Client ID and Client Secret

### Step 4: Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# YouTube API Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Optional: Backend URL (for production deployments)
VITE_CLIENT_TARGET=http://localhost:4000
```

### Step 5: Restart Development Server

After adding your credentials, restart the development server:

```bash
npm run dev
```

## Using the Setup Modal

The app includes an interactive setup modal that guides you through the process:

1. Open the app at `http://localhost:8089`
2. Click "Setup YouTube" in the header (orange button)
3. Follow the step-by-step instructions in the modal
4. Enter your credentials when prompted
5. Restart the server to apply changes

## Features

- **Automatic Upload**: Recordings are automatically uploaded to YouTube
- **Privacy Controls**: Choose between public, unlisted, or private videos
- **Progress Tracking**: Real-time upload progress
- **Error Handling**: Comprehensive error handling and retry logic
- **Token Management**: Automatic token refresh and storage

## Troubleshooting

### Common Issues

1. **"YouTube is not configured" error**
   - Make sure you've created the `.env` file with your credentials
   - Restart the development server after adding credentials

2. **OAuth popup blocked**
   - Allow popups for `localhost:8089` in your browser
   - Try the connection again

3. **"Invalid redirect URI" error**
   - Ensure your redirect URI in Google Cloud Console is exactly: `http://localhost:8089/auth/callback`
   - Check that there are no trailing slashes or extra characters

4. **"Access denied" error**
   - Make sure you've granted all required permissions
   - Check that your OAuth consent screen is properly configured

5. **Upload fails**
   - Verify that the YouTube Data API v3 is enabled
   - Check that your Google Cloud project has billing enabled
   - Ensure your OAuth credentials have the correct scopes

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Google Cloud Console configuration
3. Ensure all environment variables are set correctly
4. Try clearing your browser's local storage and reconnecting

## Security Notes

- Never commit your `.env` file to version control
- Keep your Client Secret secure
- Use environment variables for production deployments
- Regularly rotate your API credentials

## Production Deployment

For production deployments:

1. Set up a production domain
2. Update the redirect URI in Google Cloud Console
3. Use environment variables or a secure configuration management system
4. Consider using a backend service for enhanced security

## API Limits

- YouTube Data API v3 has daily quotas
- Default quota: 10,000 units per day
- Each upload operation costs 1,600 units
- Monitor your usage in the Google Cloud Console

## Support

For additional help:
- Check the [Google YouTube API documentation](https://developers.google.com/youtube/v3)
- Review the [OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)
- Open an issue in this repository
