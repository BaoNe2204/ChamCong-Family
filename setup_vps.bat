@echo off
title Auto Setup & Deploy ChamCong tren VPS
echo =========================================
echo    Auto Setup ^& Deploy ChamCong tren VPS
echo =========================================
echo.

echo [1/4] Cai dat thu vien (Dependencies)...
echo -^> Frontend...
call npm install
echo -^> Backend...
cd backend
call npm install
cd ..

echo.
echo [2/4] Khoi tao Database MySQL...
cd backend
node setup_db.js
cd ..

echo.
echo [3/4] Build Web Frontend...
call npm run build

echo.
echo [4/4] Khoi dong ung dung voi PM2...
:: Kiểm tra xem pm2 đã cài chưa
call pm2 -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Dang cai dat PM2...
    call npm install -g pm2
)

:: Chạy Backend
cd backend
call pm2 start server.js --name "chamcong-backend"
cd ..

:: Chạy Frontend (Preview)
call pm2 start "npm run preview" --name "chamcong-frontend"

echo.
echo =========================================
echo Hoan tat! Ung dung da duoc chay ngam boi PM2.
echo Su dung lenh 'pm2 status' de xem trang thai.
echo =========================================
timeout /t 10 >nul
exit
