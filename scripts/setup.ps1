Write-Host "=== dont-worry Setup Script ===" -ForegroundColor Cyan

# Backend setup
Write-Host ""
Write-Host "--- Setting up backend ---" -ForegroundColor Yellow
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -c "import nltk; nltk.download('vader_lexicon')"

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "Created backend/.env from template. Please edit with your credentials."
}

Set-Location ..

# Frontend setup
Write-Host ""
Write-Host "--- Setting up frontend ---" -ForegroundColor Yellow
Set-Location frontend
npm install

if (-not (Test-Path .env.local)) {
    Copy-Item .env.example .env.local
    Write-Host "Created frontend/.env.local from template. Please edit with your credentials."
}

Set-Location ..

Write-Host ""
Write-Host "=== Setup complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Edit backend/.env with your Supabase and Firebase credentials"
Write-Host "  2. Edit frontend/.env.local with your Supabase and Firebase credentials"
Write-Host "  3. Run the database migration in Supabase SQL Editor: backend/sql/001_init.sql"
Write-Host "  4. Start the backend:  cd backend; uvicorn app.main:app --reload"
Write-Host "  5. Start the frontend: cd frontend; npm run dev"
