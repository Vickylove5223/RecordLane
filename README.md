# RecordLane

A privacy-first, open-source screen recording application that stores all recordings directly in your YouTube channel. Built with React, TypeScript, Supabase backend, and YouTube API integration.

## 🏆 Open Source Alternative

RecordLane is an open-source alternative to expensive proprietary screen recording tools. Break free from vendor lock-in and subscription fees with a privacy-first solution that puts you in control.

### What Proprietary Tools This Replaces

RecordLane replaces popular but expensive screen recording solutions:

- **Loom** ($8-16/month) - Limited free tier, videos stored on their servers
- **Screencastify** ($3-7/month) - Chrome extension limitations, Google Drive dependency
- **Camtasia** ($299 one-time) - Desktop-only, complex setup, no cloud integration
- **OBS Studio** (Free but complex) - Steep learning curve, no built-in sharing
- **Bandicam** ($40-60) - Windows-only, limited cloud features
- **ScreenFlow** ($149) - Mac-only, expensive for basic features

### Why Choose RecordLane?

- **Free Forever**: No subscription fees or usage limits
- **Privacy First**: Videos go directly to your YouTube channel
- **Web-Based**: Works in any modern browser, no downloads
- **Cross-Platform**: Desktop, tablet, and mobile support
- **Open Source**: Full transparency and community-driven development
- **Modern Tech**: Built with latest web technologies

## 📊 Open Source Loom Alternatives Comparison

| Feature | RecordLane | ScreenRec | OpenReplay | ScreenStudio | Loom Clone | ScreenCapture |
|---------|------------|-----------|------------|--------------|------------|---------------|
| **Price** | 💰 Free | 💰 Free | 💰 Free | 💰 Free | 💰 Free | 💰 Free |
| **Privacy** | ✅ Your YouTube | ✅ Local only | ✅ Self-hosted | ✅ Local only | ✅ Local only | ✅ Local only |
| **Open Source** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Cloud Integration** | ✅ YouTube | ❌ None | ✅ Self-hosted | ❌ None | ❌ None | ❌ None |
| **Web-Based** | ✅ Yes | ❌ Desktop only | ✅ Web app | ❌ Desktop only | ✅ Yes | ❌ Desktop only |
| **Screen Recording** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Camera Recording** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Drawing Tools** | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **Click Highlights** | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Video Editing** | ✅ Client-side | ❌ No | ❌ No | ✅ Basic | ✅ Basic | ❌ No |
| **Auto Upload** | ✅ YouTube | ❌ Manual | ✅ Self-hosted | ❌ Manual | ❌ Manual | ❌ Manual |
| **Share Links** | ✅ Instant | ❌ Manual | ✅ Self-hosted | ❌ Manual | ✅ Basic | ❌ Manual |
| **Mobile Support** | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Setup Complexity** | ⭐⭐ Easy | ⭐⭐⭐⭐ Hard | ⭐⭐⭐⭐⭐ Very Hard | ⭐⭐⭐ Medium | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Hard |
| **Active Development** | ✅ Active | ⚠️ Limited | ✅ Active | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited |
| **Community** | ✅ Growing | ⚠️ Small | ✅ Large | ⚠️ Small | ⚠️ Small | ⚠️ Small |

## Demo

> **Note**: Screenshots and demo video will be added here. This section will showcase:
> - Main recording interface
> - Recording modes (screen, camera, both)
> - Drawing and annotation tools
> - Video editing and trimming
> - YouTube upload process
> - Share modal and link generation

*[Screenshots coming soon]*

## 🚀 How to Run

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** package manager
- **Supabase** account for backend services
- **Google Cloud Console** account for OAuth setup

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/recordlane.git
   cd recordlane
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install
   ```

3. **Set up Supabase** (see Configuration section below)

4. **Set up Google OAuth** (see Configuration section below)

5. **Start the frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

### Production Deployment

#### Option 1: Vercel/Netlify (Recommended)
```bash
# Build the frontend
cd frontend
npm run build

# Deploy to Vercel or Netlify
# The app will connect to your Supabase backend
```

#### Option 2: Self-Hosting
```bash
# Build the frontend
cd frontend
npm run build

# Serve the built files using any static file server
# Configure environment variables for Supabase
```

## Features

### Recording Modes
- **Screen Only**: Capture your entire screen or specific windows
- **Camera Only**: Record with your webcam for personal messages
- **Screen + Camera**: Combine screen capture with picture-in-picture camera

### Enhanced Recording
- **Click Highlights**: Visual indicators when you click during recording
- **Drawing Tools**: Draw annotations directly on screen during recording
- **Pause/Resume**: Control your recording flow with pause and resume
- **Real-time Preview**: See exactly what you're recording

### YouTube Integration
- **Direct Storage**: All recordings saved directly to your YouTube channel
- **Privacy First**: Videos never touch our servers
- **Enhanced Token Management**: Automatic token refresh with robust error handling
- **Persistent Auth**: Stay connected across browser sessions (device-specific)
- **Automatic Upload**: Resume interrupted uploads seamlessly with retry logic

### Editing & Sharing
- **Client-side Trimming**: Cut your recordings before upload
- **Instant Share Links**: Get shareable YouTube links
- **Privacy Controls**: Set viewing permissions for each recording
- **Reliable Uploads**: Enhanced retry mechanisms for upload reliability

### Performance & Reliability
- **Enhanced Error Recovery**: Comprehensive error handling with automatic retry logic
- **Token Refresh**: Automatic authentication token refresh for uninterrupted sessions
- **Connection Monitoring**: Real-time connection status with automatic reconnection
- **Optimized Loading**: Lazy loading and intelligent caching
- **Cross-browser Support**: Works on all modern browsers
- **Responsive Design**: Perfect on desktop, tablet, and mobile

## Getting Started

Once you have RecordLane running (see "How to Run" section above):

1. **Connect YouTube**: Authorize RecordLane to access your YouTube account
2. **Choose Recording Mode**: Select screen, camera, or both
3. **Start Recording**: Click the floating record button
4. **Review & Share**: Edit your recording and get an instant share link

## Privacy & Security

- **Zero Server Storage**: Your recordings never leave your YouTube channel
- **Secure Token Management**: Authentication tokens are managed securely with automatic refresh
- **Enhanced Privacy**: Advanced token encryption and secure storage
- **Minimal Permissions**: Only accesses files that RecordLane creates
- **Open Source**: Full transparency with open source code

## Browser Support

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Partial support (camera recording only)
- **Safari**: Limited support (camera recording only)

## Development

RecordLane is built with:
- React 18 with TypeScript
- Supabase for backend services and database
- YouTube API v3 with enhanced authentication
- Web Media APIs (MediaRecorder, Screen Capture)
- Tailwind CSS for styling
- Vite for development and building

## Configuration

### Supabase Setup

1. **Create a Supabase Project**
   - Go to [Supabase](https://supabase.com/) and create a new project
   - Note your project URL and anon key

2. **Set up Database Tables**
   - Run the SQL migrations in `supabase-migrations/` directory
   - Or use the Supabase SQL Editor to create the tables

3. **Configure Environment Variables**
   - Create `.env.local` in the frontend directory:
   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Google OAuth Setup

RecordLane uses Google OAuth 2.0 for YouTube integration.

1. **Create OAuth Credentials**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select **"Web application"** as the application type
   - Give it a name (e.g., "RecordLane Web Client")

2. **Configure Authorized Redirect URIs**
   - Add the following URIs:
   - `http://localhost:5173/auth/callback` (for local development)
   - `https://yourdomain.com/auth/callback` (for production)

3. **Enable APIs**
   - Go to "APIs & Services" > "Library"
   - Search for and enable the **"YouTube Data API v3"**

4. **Configure Supabase Auth**
   - In your Supabase project, go to Authentication > Providers
   - Enable Google provider and add your OAuth credentials

## Migration from Encore

If you're upgrading from the previous Encore-based version:

1. **Backup your data** (if you have any existing recordings)
2. **Set up Supabase** following the configuration steps above
3. **Update your environment variables** to use Supabase instead of Encore
4. **Run the database migrations** in the `supabase-migrations/` directory

See `SUPABASE_MIGRATION_GUIDE.md` for detailed migration instructions.

## Enhanced Features

### Token Management
- Automatic token refresh before expiration
- Proactive token validation
- Secure token storage with encryption
- Real-time token status monitoring

### Error Handling
- Comprehensive retry logic for API calls
- Graceful handling of authentication failures
- User-friendly error messages and recovery options
- Automatic fallback mechanisms

### Performance
- Optimized caching with intelligent cleanup
- Lazy loading for better initial load times
- Performance monitoring and optimization suggestions
- Memory usage optimization

## Backend Services

RecordLane uses Supabase for backend services:

- **Database**: PostgreSQL database for storing recording metadata
- **Authentication**: Supabase Auth for user management and OAuth integration
- **Real-time**: Real-time subscriptions for live updates
- **Storage**: Optional file storage for temporary files
- **API**: Auto-generated REST and GraphQL APIs

## License

MIT License - see LICENSE file for details

## Support

For support, please use the project's issue tracker.
