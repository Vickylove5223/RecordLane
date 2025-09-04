# RecordLane

A privacy-first, open-source screen recording application that stores all recordings directly in your YouTube channel. Built with React, TypeScript, and YouTube API integration.

## Features

### 🎥 Recording Modes
- **Screen Only**: Capture your entire screen or specific windows
- **Camera Only**: Record with your webcam for personal messages
- **Screen + Camera**: Combine screen capture with picture-in-picture camera

### 🎨 Enhanced Recording
- **Click Highlights**: Visual indicators when you click during recording
- **Drawing Tools**: Draw annotations directly on screen during recording
- **Pause/Resume**: Control your recording flow with pause and resume
- **Real-time Preview**: See exactly what you're recording

### ☁️ YouTube Integration
- **Direct Storage**: All recordings saved directly to your YouTube channel
- **Privacy First**: Videos never touch our servers
- **Enhanced Token Management**: Automatic token refresh with robust error handling
- **Persistent Auth**: Stay connected across browser sessions (device-specific)
- **Automatic Upload**: Resume interrupted uploads seamlessly with retry logic

### ✂️ Editing & Sharing
- **Client-side Trimming**: Cut your recordings before upload
- **Instant Share Links**: Get shareable YouTube links
- **Privacy Controls**: Set viewing permissions for each recording
- **Reliable Uploads**: Enhanced retry mechanisms for upload reliability

### 🚀 Performance & Reliability
- **Enhanced Error Recovery**: Comprehensive error handling with automatic retry logic
- **Token Refresh**: Automatic authentication token refresh for uninterrupted sessions
- **Connection Monitoring**: Real-time connection status with automatic reconnection
- **Optimized Loading**: Lazy loading and intelligent caching
- **Cross-browser Support**: Works on all modern browsers
- **Responsive Design**: Perfect on desktop, tablet, and mobile

## Getting Started

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
- YouTube API v3 with enhanced authentication
- Web Media APIs (MediaRecorder, Screen Capture)
- Tailwind CSS for styling
- Vite for development and building
- Encore.ts for backend services

## Configuration

### OAuth Setup

RecordLane uses Google OAuth 2.0 with PKCE for secure authentication. The application is configured for development:

- **Development**: `http://localhost:8089` (or your preferred port)

### Google Cloud Console Configuration

Ensure your Google Cloud Console project has the following authorized redirect URIs:

<<<<<<< HEAD
- `http://localhost:8089/auth/callback` (for local development)
- `http://localhost:5173/auth/callback` (for Vite default port)
- `http://localhost:3000/auth/callback` (alternative port)
=======
- `https://loom-clone-d2qv2u482vjq7vcc59sg.lp.dev/auth/callback`
- `http://localhost:3000/auth/callback` (for local development)
>>>>>>> 5e9d3b03bfb090ad01a07028fb707e813e785e29

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

## API Endpoints

RecordLane includes a backend service built with Encore.ts:

- **Metadata Service**: Manages recording metadata and listings
- **Analytics Service**: Tracks usage statistics and performance metrics
- **Health Service**: Monitors application health and service status

## License

MIT License - see LICENSE file for details

## Support

For support, please use the project's issue tracker.
