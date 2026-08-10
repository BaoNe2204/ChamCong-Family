@echo off
title Cap nhat Code tu Git
echo =========================================
echo       Dang keo code moi nhat tu Git...
echo =========================================
echo.

call git pull origin main

echo.
echo =========================================
echo Hoan tat viec keo code!
echo =========================================
timeout /t 5 >nul
exit
