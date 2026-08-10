@echo off
title ChamCong Family - Build Web Frontend
echo ==============================================
echo       DONG GOI WEB FRONTEND (BUILD) CHO IIS
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
echo Sep hay copy thu muc "dist" nay va tro IIS vao day!
echo IIS se chay tren cong 80 va phuc vu web luon ma ko can cau noi nao ca.
echo ==============================================
pause
