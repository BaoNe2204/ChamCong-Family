@echo off
title Cap nhat Code tu Git
echo =========================================
echo       Dang keo code moi nhat tu Git...
echo =========================================
echo.

call git fetch --all
call git reset --hard origin/main
call git clean -fd

echo.
echo =========================================
echo Hoan tat viec keo code!
echo =========================================
timeout /t 5 >nul
exit
