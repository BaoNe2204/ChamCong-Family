@echo off
title ChamCong Family - Web Production
echo ==============================================
echo       CHAY WEB (PRODUCTION) BANG NODE.JS
echo ==============================================
echo.
echo 1. Dang tien hanh Build source code...
call npm install
call npm run build
echo.
echo 2. Khoi dong Web Server tren cong 80 (Mac dinh cua Web)...
echo (Ban co the truy cap truc tiep vao http://localhost hoac IP VPS ma khong can go cong)
echo.
call npx serve -s dist -p 80
pause
