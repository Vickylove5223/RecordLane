# 🚀 Migration Guide: Encore → Supabase

This guide walks you through migrating the RecordLane backend from Encore to Supabase.

## 📋 Migration Overview

### What's Being Migrated:
- **Database**: PostgreSQL tables (recordings, events) with RLS policies
- **APIs**: 8 endpoints converted to Supabase Edge Functions
- **Authentication**: Google OAuth integration
- **Frontend**: Updated to use Supabase client

### Migration Benefits:
- ✅ Simplified deployment and hosting
- ✅ Built-in authentication and RLS
- ✅ Real-time capabilities
- ✅ Better developer experience
- ✅ Cost-effective scaling

## 🛠️ Step-by-Step Migration

### Step 1: Install Dependencies

```bash
# Install Supabase CLI
npm install -g supabase

# Install project dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
```

### Step 2: Start Supabase

```bash
# Start Supabase locally
supabase start

# This will:
# - Start PostgreSQL database
# - Start Supabase Studio
# - Start Edge Functions runtime
# - Apply database migrations
```

### Step 3: Deploy Edge Functions

```bash
# Deploy all Edge Functions
supabase functions deploy

# Or deploy individually:
supabase functions deploy health
supabase functions deploy recordings
supabase functions deploy analytics
supabase functions deploy auth
```

### Step 4: Configure Environment Variables

Create `frontend/.env.local`:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Step 5: Update Frontend Services

The frontend has been updated to use `supabaseService.ts` instead of the old Encore services.

### Step 6: Test the Migration

```bash
# Start both frontend and backend
npm run dev

# Test endpoints:
curl http://localhost:54321/functions/v1/health
curl http://localhost:54321/functions/v1/recordings
curl http://localhost:54321/functions/v1/analytics
```

## 🔄 API Endpoint Mapping

| Encore Endpoint | Supabase Edge Function | Status |
|----------------|----------------------|--------|
| `GET /health` | `GET /functions/v1/health` | ✅ |
| `GET /recordings` | `GET /functions/v1/recordings` | ✅ |
| `POST /recordings` | `POST /functions/v1/recordings` | ✅ |
| `GET /analytics/stats` | `GET /functions/v1/analytics` | ✅ |
| `GET /auth/config` | `GET /functions/v1/auth/config` | ✅ |
| `POST /auth/google/exchange-code` | `POST /functions/v1/auth/google/exchange-code` | ✅ |
| `POST /auth/google/refresh-token` | `POST /functions/v1/auth/google/refresh-token` | ✅ |

## 🗄️ Database Schema

### Recordings Table
```sql
CREATE TABLE recordings (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  youtube_video_id VARCHAR(255) NOT NULL UNIQUE,
  youtube_link TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration >= 0),
  privacy VARCHAR(50) NOT NULL CHECK (privacy IN ('private', 'unlisted', 'public')),
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Events Table
```sql
CREATE TABLE events (
  id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  recording_id VARCHAR(255),
  session_id VARCHAR(255),
  user_agent TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

## 🔐 Row Level Security (RLS)

- **Recordings**: Public read, authenticated write/update/delete
- **Events**: Public insert (analytics), authenticated read

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. Create Supabase project at https://supabase.com
2. Deploy Edge Functions: `supabase functions deploy --project-ref YOUR_PROJECT_REF`
3. Update environment variables with production URLs
4. Deploy frontend to your preferred hosting platform

## 🔧 Troubleshooting

### Common Issues:

1. **Supabase not starting**: Check if Docker is running
2. **Functions not deploying**: Verify Supabase CLI is logged in
3. **CORS errors**: Check Edge Function CORS headers
4. **Database connection**: Verify Supabase is running and migrations applied

### Useful Commands:

```bash
# Check Supabase status
supabase status

# View logs
supabase functions logs

# Reset database
supabase db reset

# Stop Supabase
supabase stop
```

## 📊 Performance Comparison

| Feature | Encore | Supabase |
|---------|--------|----------|
| Setup Time | 5-10 min | 2-3 min |
| Database | Managed PostgreSQL | Managed PostgreSQL |
| Authentication | Custom OAuth | Built-in + Custom |
| Real-time | ❌ | ✅ |
| Edge Functions | ❌ | ✅ |
| RLS | ❌ | ✅ |
| Cost | Variable | Predictable |

## 🎯 Next Steps

1. ✅ Complete local migration
2. 🔄 Test all functionality
3. 🚀 Deploy to production
4. 📊 Monitor performance
5. 🔧 Optimize as needed

## 📞 Support

If you encounter issues during migration:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check Edge Function logs
4. Verify environment variables
