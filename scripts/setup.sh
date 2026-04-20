#!/bin/bash
set -e

echo "=== dont-worry Setup Script ==="

# Backend setup
echo ""
echo "--- Setting up backend ---"
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -c "import nltk; nltk.download('vader_lexicon')"

if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created backend/.env from template. Please edit with your credentials."
fi

cd ..

# Frontend setup
echo ""
echo "--- Setting up frontend ---"
cd frontend
npm install

if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "Created frontend/.env.local from template. Please edit with your credentials."
fi

cd ..

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env with your Supabase and Firebase credentials"
echo "  2. Edit frontend/.env.local with your Supabase and Firebase credentials"
echo "  3. Run the database migration in Supabase SQL Editor: backend/sql/001_init.sql"
echo "  4. Start the backend:  cd backend && uvicorn app.main:app --reload"
echo "  5. Start the frontend: cd frontend && npm run dev"
