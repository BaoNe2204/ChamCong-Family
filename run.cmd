@echo off
title Start ChamCong Family
echo =========================================
echo       Starting ChamCong Family App
echo =========================================
echo.

echo [1/4] Checking and installing dependencies...
echo --- Installing Frontend dependencies ---
call npm install
echo --- Installing Backend dependencies ---
cd backend
call npm install
cd ..
echo --- Installing Mobile dependencies ---
cd mobile
call npm install
cd ..

echo.
echo [2/4] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && node server.js"

echo [3/4] Starting Frontend Web (Vite)...
start "Frontend Web" cmd /k "npm run dev"

echo [4/4] Starting Mobile App (Expo)...
start "Mobile Expo" cmd /k "cd mobile && npm start"

echo.
echo All services are starting up!
echo You can close this window, the 3 server windows will remain open.
timeout /t 5 >nul
exit
