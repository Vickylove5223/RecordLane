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

| Feature | RecordLane | [Snapify.it](https://snapify.it/) | Cap.so | OpenReplay | ScreenStudio |
|---------|------------|-----------------------------------|--------|------------|--------------|
| **Price** | 💰 Free | 💰 Free | 💰 Free | 💰 Free | 💰 Free |
| **Privacy** | ✅ Your YouTube | ✅ Self-hosted | ✅ Self-hosted | ✅ Self-hosted | ✅ Local only |
| **Open Source** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Cloud Integration** | ✅ YouTube | ✅ Self-hosted | ✅ Self-hosted | ✅ Self-hosted | ❌ None |
| **Web-Based** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Web app | ❌ Desktop only |
| **Screen Recording** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Camera Recording** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| **Drawing Tools** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| **Click Highlights** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Video Editing** | ✅ Client-side | ✅ Basic | ✅ Basic | ❌ No | ✅ Basic |
| **Auto Upload** | ✅ YouTube | ✅ Self-hosted | ✅ Self-hosted | ✅ Self-hosted | ❌ Manual |
| **Share Links** | ✅ Instant | ✅ Instant | ✅ Instant | ✅ Self-hosted | ❌ Manual |
| **Mobile Support** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Setup Complexity** | ⭐⭐ Easy | ⭐⭐⭐ Medium | ⭐⭐⭐ Medium | ⭐⭐⭐⭐⭐ Very Hard | ⭐⭐⭐ Medium |
| **Active Development** | ✅ Active | ✅ Active | ✅ Active | ✅ Active | ⚠️ Limited |
| **Community** | ✅ Growing | ✅ Large | ✅ Growing | ✅ Large | ⚠️ Small |

## Demo

*Demo video will be provided here*

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
   - Note your project URL and anon key from Settings > API

2. **Set up Database Tables**
   - Run the SQL migrations in `supabase-migrations/` directory:
   ```sql
   -- Create recordings table
   CREATE TABLE recordings (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     youtube_video_id TEXT UNIQUE NOT NULL,
     title TEXT NOT NULL,
     description TEXT,
     duration INTEGER,
     file_size BIGINT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Create events table
   CREATE TABLE events (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     event_type TEXT NOT NULL,
     event_data JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Enable Row Level Security
   ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE events ENABLE ROW LEVEL SECURITY;
   
   -- Create policies
   CREATE POLICY "Users can view own recordings" ON recordings
     FOR SELECT USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can insert own recordings" ON recordings
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   
   CREATE POLICY "Users can update own recordings" ON recordings
     FOR UPDATE USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can delete own recordings" ON recordings
     FOR DELETE USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can view own events" ON events
     FOR SELECT USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can insert own events" ON events
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   ```

3. **Configure Environment Variables**
   - Create `.env.local` in the frontend directory:
   ```bash
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   
   - Or update `frontend/config/supabase.ts` directly:
   ```typescript
   export const supabaseConfig = {
     url: 'https://your-project-id.supabase.co',
     anonKey: 'your-anon-key-here'
   }
   ```

4. **Enable Google OAuth in Supabase**
   - Go to Authentication > Providers in your Supabase dashboard
   - Enable Google provider
   - Add your Google OAuth credentials (see Google OAuth Setup below)

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
