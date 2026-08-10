@echo off
title Cai dat URL Rewrite va ARR cho IIS
echo ========================================================
echo   DANG TU DONG TAI VA CAI DAT DO CHOI CHO IIS (VPS)
echo ========================================================
echo.

echo 1. Dang tai URL Rewrite 2.1...
powershell -Command "Invoke-WebRequest -Uri 'https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi' -OutFile 'rewrite.msi'"

echo 2. Dang cai dat URL Rewrite...
msiexec /i rewrite.msi /quiet /norestart

echo 3. Dang tai Application Request Routing (ARR) 3.0...
powershell -Command "Invoke-WebRequest -Uri 'https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi' -OutFile 'arr.msi'"

echo 4. Dang cai dat ARR...
msiexec /i arr.msi /quiet /norestart

echo 5. Dang xoa file rac...
del rewrite.msi
del arr.msi

echo 6. Kich hoat Proxy cho ARR...
%windir%\system32\inetsrv\appcmd.exe set config -section:system.webServer/proxy /enabled:"True" /commit:apphost

echo 7. Khoi dong lai IIS...
iisreset

echo ========================================================
echo HOAN THANH! IIS da duoc nang cap full giap!
echo Bay gio sep vao lai web la bao dam 100% len hinh ngay!
echo ========================================================
pause
