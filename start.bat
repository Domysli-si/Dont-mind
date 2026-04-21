@echo off
title dont-worry - Starting...

echo ============================================
echo    dont-worry - Mental Well-being Tracker
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.10+ first.
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install Node.js 18+ first.
    pause
    exit /b 1
)

echo [1/4] Installing backend dependencies...
cd /d "%~dp0backend"
if not exist "venv" (
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet

echo [2/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    call npm install
) else (
    echo      node_modules found, skipping...
)

echo [3/4] Starting backend (http://localhost:8000)...
cd /d "%~dp0backend"
start "dont-worry Backend" cmd /k "call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo [4/4] Starting frontend (http://localhost:5173)...
cd /d "%~dp0frontend"
start "dont-worry Frontend" cmd /k "npm run dev"

timeout /t 4 >nul

echo.
echo ============================================
echo    App is running!
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo    API docs: http://localhost:8000/docs
echo ============================================
echo.
echo Close this window or press any key to exit.
echo (Backend and Frontend will keep running in their own windows)
pause >nul
