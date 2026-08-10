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
echo 2. Khoi dong Web Server tren cong 5173...
echo (Ban co the truy cap vao http://localhost:5173 de xem)
echo.
call npx serve -s dist -p 5173
pause
