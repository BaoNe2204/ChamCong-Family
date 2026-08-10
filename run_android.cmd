@echo off
title ChamCong Family - Android App
echo ==============================================
echo             CHAY UNG DUNG ANDROID
echo ==============================================
echo.
cd mobile
echo Dang cai dat thu vien neu chua co...
call npm install
echo.
echo Khoi dong Expo (Che do Tunnel cho VPS)...
call npx expo start -c --tunnel
pause
