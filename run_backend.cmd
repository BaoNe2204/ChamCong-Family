@echo off
title ChamCong Family - Backend
echo ==============================================
echo             CHAY MAY CHU BACKEND
echo ==============================================
echo.
cd backend
echo Dang cai dat thu vien neu chua co...
call npm install
echo.
echo Dang khoi dong Backend tren port 5000...
node server.js
pause
