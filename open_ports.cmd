@echo off
title Mo Port cho ChamCong tren VPS
echo =========================================
echo       Dang mo cac cong (ports) tren VPS...
echo =========================================
echo.

echo Mo cong 5000 cho Backend...
netsh advfirewall firewall add rule name="ChamCong Backend (5000)" dir=in action=allow protocol=TCP localport=5000
echo.

echo Mo cong 5173 cho Frontend Dev...
netsh advfirewall firewall add rule name="ChamCong Frontend Dev (5173)" dir=in action=allow protocol=TCP localport=5173
echo.

echo Mo cong 4173 cho Frontend Preview...
netsh advfirewall firewall add rule name="ChamCong Frontend Preview (4173)" dir=in action=allow protocol=TCP localport=4173
echo.

echo Mo cong 8081 cho Expo Mobile...
netsh advfirewall firewall add rule name="ChamCong Expo (8081)" dir=in action=allow protocol=TCP localport=8081
echo.

echo =========================================
echo ✅ Da mo port thanh cong tren Firewall cua Windows VPS!
echo =========================================
timeout /t 5 >nul
exit
