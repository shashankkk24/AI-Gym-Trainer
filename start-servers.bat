@echo off
echo Starting GRIT Hackathon servers...

REM Start backend FastAPI server
echo Starting backend server on port 8000...
start "Backend Server" cmd /k "cd /d backend && "C:/Users/mohammad arbaz ahmed/AppData/Local/Programs/Python/Python312/python.exe" main.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend Next.js server
echo Starting frontend server on port 3000...
start "Frontend Server" cmd /k "cd /d frontend && npm run dev"

echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo Recovery API: http://localhost:8000/api/recovery/injuries

pause