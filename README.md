# RecordLane

A privacy-first, open-source screen recording application that stores all recordings directly in your Google Drive. Built with React, TypeScript, and Google Drive API integration.

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

### ☁️ Google Drive Integration
- **Direct Storage**: All recordings saved directly to your Google Drive
- **Privacy First**: Videos never touch our servers
- **Persistent Auth**: Stay connected across browser sessions (device-specific)
- **Automatic Folder**: Creates "RecordLane Recordings" folder in your Drive

### ✂️ Editing & Sharing
- **Client-side Trimming**: Cut your recordings before upload
- **Instant Share Links**: Get shareable Google Drive links
- **Privacy Controls**: Set viewing permissions for each recording
- **Automatic Upload**: Resume interrupted uploads seamlessly

### 🚀 Performance & Reliability
- **Error Recovery**: Comprehensive error handling and retry logic
- **Optimized Loading**: Lazy loading and intelligent caching
- **Cross-browser Support**: Works on all modern browsers
- **Responsive Design**: Perfect on desktop, tablet, and mobile

## Getting Started

1. **Connect Google Drive**: Authorize RecordLane to access your Google Drive
2. **Choose Recording Mode**: Select screen, camera, or both
3. **Start Recording**: Click the floating record button
4. **Review & Share**: Edit your recording and get an instant share link

## Privacy & Security

- **Zero Server Storage**: Your recordings never leave your Google Drive
- **Encrypted Tokens**: Authentication tokens are encrypted client-side
- **Minimal Permissions**: Only accesses files that RecordLane creates
- **Open Source**: Full transparency with open source code

## Browser Support

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Partial support (camera recording only)
- **Safari**: Limited support (camera recording only)

## Development

RecordLane is built with:
- React 18 with TypeScript
- Google Drive API v3
- Web Media APIs (MediaRecorder, Screen Capture)
- Tailwind CSS for styling
- Vite for development and building

## License

MIT License - see LICENSE file for details
