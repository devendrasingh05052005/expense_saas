@echo off
echo ========================================================
echo   RoomMates SaaS - Shared Room Expense Manager
echo ========================================================
echo Launching Backend (FastAPI :8000) and Frontend (Vite :5173)...
echo.

start "RoomMates Backend API" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
start "RoomMates Frontend UI" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Done! The app will open in your browser:
echo Frontend: http://localhost:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo.
timeout /t 3 /nobreak >nul
start http://localhost:5173
