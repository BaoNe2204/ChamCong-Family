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
echo Khoi dong Expo cho Android...
call npx expo start --android
pause
