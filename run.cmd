@echo off
title Start ChamCong Family
echo =========================================
echo       Starting ChamCong Family App
echo =========================================
echo.

echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && node server.js"

echo [2/3] Starting Frontend Web (Vite)...
start "Frontend Web" cmd /k "npm run dev"

echo [3/3] Starting Mobile App (Expo)...
start "Mobile Expo" cmd /k "cd mobile && npm start"

echo.
echo All services are starting up!
echo You can close this window, the 3 server windows will remain open.
timeout /t 5 >nul
exit
