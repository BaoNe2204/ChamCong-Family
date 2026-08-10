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
echo Khoi dong Expo (Che do Public IP cho VPS)...
set REACT_NATIVE_PACKAGER_HOSTNAME=180.93.59.237
call npx expo start -c
pause
