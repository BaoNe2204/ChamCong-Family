@echo off
title ChamCong Family - Build Web Frontend
echo ==============================================
echo       DONG GOI WEB FRONTEND (BUILD)
echo ==============================================
echo.
echo 1. Dang cai dat thu vien neu chua co...
call npm install
echo.
echo 2. Dang tien hanh dong goi vao thu muc \dist...
call npm run build
echo.
echo ==============================================
echo HOAN THANH XUAT XAC! 
echo Code hoan chinh cua trang web da duoc tao ra nam o trong thu muc "dist".
echo Sep co the copy toan bo ben trong thu muc "dist" de bo vao IIS, Nginx hoac bat cu Hosting nao.
echo ==============================================
pause
