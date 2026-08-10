@echo off
title Tao Tai Khoan Mau
echo =========================================
echo       Dang tao tai khoan Admin va Nhan vien...
echo =========================================
echo.

cd backend
call node seed.js

echo.
echo =========================================
echo ✅ Hoan tat! Ban co the dang nhap bang cac tai khoan tren.
echo =========================================
pause
exit
