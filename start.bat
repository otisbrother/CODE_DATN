@echo off
title E-Learning System
echo ====================================
echo   E-Learning AI System - Starting...
echo ====================================
echo.

:: Start Backend
echo [1/2] Starting Backend (port 5000)...
start "Backend" cmd /k "cd /d %~dp0backend && node src/server.js"

:: Wait 2 seconds for backend to start
timeout /t 2 /nobreak >nul

:: Start Frontend
echo [2/2] Starting Frontend (port 5173)...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ====================================
echo   DONE! System is running:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ====================================
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:5173
