# Deployment Guide

## Database -- Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `backend/sql/001_init.sql` in the SQL Editor
3. Note your connection string from **Settings > Database**

### Required Configuration

- Enable Email authentication with Magic Links
- Set the Site URL to your frontend domain (e.g., `https://your-app.vercel.app`)
- Add your frontend domain to the redirect URLs

## Backend -- Railway

### Steps

1. Create a new project at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Set the root directory to `backend`
4. Railway will auto-detect the Dockerfile

### Environment Variables

Set the following in Railway's dashboard:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Your service role key |
| `SUPABASE_JWT_SECRET` | Your JWT secret |
| `DATABASE_URL` | Your Supabase PostgreSQL connection string |
| `FIREBASE_CREDENTIALS` | Path to Firebase service account JSON |
| `VAPID_PRIVATE_KEY` | Your VAPID private key |
| `CORS_ORIGINS` | Your Vercel frontend URL |

### Custom Start Command

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Frontend -- Vercel

### Steps

1. Import the repository at [vercel.com](https://vercel.com)
2. Set the root directory to `frontend`
3. Framework preset: Vite
4. Build command: `npm run build`
5. Output directory: `dist`

### Environment Variables

Set the following in Vercel's dashboard:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_API_URL` | Your Railway backend URL |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_VAPID_PUBLIC_KEY` | Your VAPID public key |

## Post-Deployment Checklist

- [ ] Verify Supabase Auth redirect URLs include your production domain
- [ ] Test magic link login flow end-to-end
- [ ] Verify CORS origins on the backend include your Vercel domain
- [ ] Test PWA installation on Android and desktop
- [ ] Verify push notifications work
- [ ] Check offline mode and sync functionality
