# Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- A Supabase account (free tier)
- A Firebase project (free tier)
- Git

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/dont-worry.git
cd dont-worry
```

## 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy:
   - Project URL (`SUPABASE_URL`)
   - `anon` public key (`SUPABASE_ANON_KEY`)
   - `service_role` key (`SUPABASE_SERVICE_KEY`)
   - JWT Secret (`SUPABASE_JWT_SECRET`)
3. Go to **SQL Editor** and run the contents of `backend/sql/001_init.sql`
4. Go to **Authentication > Providers** and ensure Email provider is enabled with "Enable Magic Link" checked

## 3. Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Cloud Messaging
3. Go to **Project Settings > General** and copy the web app config values
4. Go to **Cloud Messaging > Web Push certificates** and generate a VAPID key pair
5. Download the service account JSON for backend use

## 4. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` with your Supabase and Firebase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
FIREBASE_CREDENTIALS=firebase-service-account.json
VAPID_PRIVATE_KEY=your-vapid-private-key
CORS_ORIGINS=http://localhost:5173
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

The API is now available at `http://localhost:8000`. View the auto-generated docs at `http://localhost:8000/docs`.

## 5. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

Start the dev server:

```bash
npm run dev
```

The app is now available at `http://localhost:5173`.

## 6. Running Tests

### Backend

```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
npm test
```

## 7. Docker (Alternative)

To run the entire stack locally with Docker:

```bash
docker-compose up
```

This starts the backend at port 8000. You still need to configure environment variables in `backend/.env`.
