# dont-worry

A Progressive Web Application for mental well-being tracking. Record your daily mood, write journal entries, visualize trends, and receive personalized recommendations powered by simple machine learning.

## Features

- **Mood Tracking** -- Record mood on a 1-10 scale with optional notes
- **Journal** -- Write text entries with automatic sentiment analysis
- **Analytics** -- Visualize mood trends, sentiment distribution, and correlations
- **ML-Powered Recommendations** -- Suggestions based on mood patterns and journal sentiment
- **Offline Support** -- Full offline capability with automatic sync when reconnected
- **Push Notifications** -- Daily mood reminders via Firebase Cloud Messaging
- **PWA** -- Installable on Windows, Linux, and Android via browser

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, shadcn/ui |
| Backend | Python, FastAPI, Pydantic v2 |
| Database | PostgreSQL (Supabase) |
| ML/NLP | NLTK (VADER), scikit-learn, pandas |
| Auth | Supabase Auth (magic link) |
| Offline | Dexie.js (IndexedDB) |
| Notifications | Firebase Cloud Messaging |
| Charts | Recharts |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker (optional, for local development)

### Using Docker

```bash
docker-compose up
```

This starts the backend at `http://localhost:8000` and serves the frontend build.

### Manual Setup

#### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env       # edit with your credentials
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # edit with your credentials
npm run dev
```

## Project Structure

```
dont-worry/
├── frontend/          # React PWA (Vite + TypeScript)
│   ├── src/
│   │   ├── components/  # UI components (shadcn/ui based)
│   │   ├── pages/       # Route pages
│   │   ├── context/     # React context providers
│   │   ├── db/          # Dexie.js IndexedDB setup
│   │   ├── services/    # Sync service
│   │   ├── lib/         # Utilities, API client, Supabase, Firebase
│   │   └── hooks/       # Custom hooks
│   └── public/          # Static assets, service worker
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/routes/  # API route handlers
│   │   ├── core/        # Config, database, auth
│   │   ├── models/      # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── middleware/  # Custom middleware
│   ├── sql/             # Database migrations
│   └── tests/           # pytest test suite
├── ml/                # Machine learning modules
│   ├── sentiment/       # VADER sentiment analysis
│   ├── trend/           # Mood trend detection
│   └── recommendations/ # Recommendation engine
├── docs/              # Documentation
├── scripts/           # Utility scripts
├── docker-compose.yml
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/moods` | Create mood entry |
| GET | `/api/moods` | List mood entries |
| POST | `/api/journal` | Create journal entry |
| GET | `/api/journal` | List journal entries |
| GET | `/api/analytics/mood-trend` | Mood trend (14 days) |
| GET | `/api/analytics/sentiment-trend` | Sentiment trend (30 days) |
| GET | `/api/analytics/correlation` | Mood-sentiment correlation |
| GET | `/api/recommendations` | Get recommendations |
| GET | `/api/user/preferences` | Get user preferences |
| PUT | `/api/user/preferences` | Update user preferences |
| POST | `/api/sync` | Sync offline data |
| POST | `/api/recommendations/admin` | Create recommendation (admin) |
| DELETE | `/api/recommendations/admin/:id` | Delete recommendation (admin) |

## Testing

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

## Deployment

| Component | Platform | Guide |
|-----------|----------|-------|
| Frontend | Vercel | [Deployment Guide](docs/guides/deployment.md) |
| Backend | Railway | [Deployment Guide](docs/guides/deployment.md) |
| Database | Supabase | [Deployment Guide](docs/guides/deployment.md) |

## Future Features

The following features are planned but not yet implemented:

- Gamification and achievements
- Streaks and daily goals
- AI chatbot for guided journaling
- Therapist dashboard
- Advanced ML models for deeper pattern recognition

## License

[MIT](LICENSE)
