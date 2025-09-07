# 🚀 RecordLane - Supabase Backend

This is the migrated version of RecordLane using Supabase as the backend instead of Encore.

## 🎯 Quick Start

### Option 1: Automated Setup (Windows)
```bash
# Run the setup script
setup-supabase.bat
```

### Option 2: Manual Setup

1. **Install Dependencies**
   ```bash
   # Install Supabase CLI globally
   npm install -g supabase
   
   # Install project dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install
   ```

2. **Start Supabase**
   ```bash
   # Start Supabase locally
   supabase start
   ```

3. **Start Frontend**
   ```bash
   # In a new terminal
   cd frontend
   npm run dev
   ```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **API Base URL**: http://localhost:54321
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres

## 📁 Project Structure

```
recordlane-supabase/
├── supabase/                    # Supabase configuration
│   ├── config.toml             # Supabase config
│   ├── migrations/              # Database migrations
│   └── functions/               # Edge Functions
│       ├── health/              # Health check API
│       ├── recordings/          # Recordings CRUD API
│       ├── analytics/           # Analytics API
│       └── auth/                # Authentication API
├── frontend/                    # React frontend
│   ├── lib/supabase.ts         # Supabase client
│   ├── services/supabaseService.ts  # API service layer
│   └── src/config/supabase.ts  # Configuration
├── package.json                 # Root package.json
└── MIGRATION_GUIDE.md          # Detailed migration guide
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start both frontend and Supabase
npm run dev:frontend     # Start only frontend
npm run dev:supabase     # Start only Supabase

# Supabase
npm run start            # Start Supabase
npm run stop             # Stop Supabase
npm run reset            # Reset database
npm run migrate          # Apply migrations
npm run deploy           # Deploy Edge Functions

# Frontend
cd frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
```

## 🗄️ Database Schema

### Recordings Table
- `id` (VARCHAR) - Primary key
- `title` (VARCHAR) - Video title
- `youtube_video_id` (VARCHAR) - YouTube video ID
- `youtube_link` (TEXT) - YouTube URL
- `duration` (INTEGER) - Duration in seconds
- `privacy` (VARCHAR) - private/unlisted/public
- `thumbnail_url` (TEXT) - Thumbnail URL
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

### Events Table
- `id` (VARCHAR) - Primary key
- `event_type` (VARCHAR) - Event type
- `recording_id` (VARCHAR) - Related recording ID
- `session_id` (VARCHAR) - Session ID
- `user_agent` (TEXT) - User agent string
- `properties` (JSONB) - Event properties
- `created_at` (TIMESTAMP) - Creation timestamp

## 🔐 Authentication

The app uses Google OAuth for authentication. Configure your Google OAuth credentials in the Supabase Edge Functions environment variables:

- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/functions/v1/health` | GET | Health check |
| `/functions/v1/recordings` | GET | List recordings |
| `/functions/v1/recordings` | POST | Create recording |
| `/functions/v1/analytics` | GET | Get analytics |
| `/functions/v1/auth/config` | GET | Get auth config |
| `/functions/v1/auth/google/exchange-code` | POST | Exchange OAuth code |
| `/functions/v1/auth/google/refresh-token` | POST | Refresh token |

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and API keys

2. **Deploy Edge Functions**
   ```bash
   supabase functions deploy --project-ref YOUR_PROJECT_REF
   ```

3. **Update Environment Variables**
   - Set production Supabase URL and keys
   - Configure Google OAuth credentials

4. **Deploy Frontend**
   - Build the frontend: `cd frontend && npm run build`
   - Deploy to your preferred hosting platform

## 🔧 Troubleshooting

### Common Issues

1. **Supabase not starting**
   - Ensure Docker is running
   - Check if ports 54321-54324 are available

2. **Functions not deploying**
   - Verify Supabase CLI is logged in: `supabase login`
   - Check project reference is correct

3. **CORS errors**
   - Verify Edge Function CORS headers are set
   - Check frontend is using correct API URLs

4. **Database connection issues**
   - Ensure Supabase is running: `supabase status`
   - Check migrations are applied: `supabase db reset`

### Useful Commands

```bash
# Check Supabase status
supabase status

# View function logs
supabase functions logs

# Reset database
supabase db reset

# Stop Supabase
supabase stop

# Login to Supabase
supabase login
```

## 📈 Performance Benefits

- **Faster Setup**: 2-3 minutes vs 5-10 minutes
- **Built-in Features**: Authentication, RLS, Real-time
- **Better DX**: Supabase Studio, better error messages
- **Cost Effective**: Predictable pricing model
- **Scalability**: Automatic scaling and optimization

## 🔄 Migration from Encore

If you're migrating from the Encore version:

1. **Backup Data**: Export any existing data
2. **Run Setup**: Use the setup scripts above
3. **Import Data**: Use Supabase Studio to import data
4. **Test**: Verify all functionality works
5. **Deploy**: Follow production deployment steps

## 📞 Support

- **Documentation**: [Supabase Docs](https://supabase.com/docs)
- **Community**: [Supabase Discord](https://discord.supabase.com)
- **Issues**: Create an issue in this repository

## 🎉 What's Next?

- [ ] Add real-time features
- [ ] Implement advanced analytics
- [ ] Add user management
- [ ] Optimize performance
- [ ] Add more integrations
