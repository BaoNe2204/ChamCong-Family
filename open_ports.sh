#!/bin/bash
echo "========================================="
echo "       Dang mo cac cong (ports) tren VPS..."
echo "========================================="
echo ""

# UFW (Ubuntu/Debian)
if command -v ufw > /dev/null; then
    echo "Phat hien UFW Firewall..."
    sudo ufw allow 5000/tcp
    sudo ufw allow 5173/tcp
    sudo ufw allow 4173/tcp
    sudo ufw reload
    echo "✅ Da mo port tren UFW!"
# Firewalld (CentOS/RHEL)
elif command -v firewall-cmd > /dev/null; then
    echo "Phat hien Firewalld..."
    sudo firewall-cmd --zone=public --add-port=5000/tcp --permanent
    sudo firewall-cmd --zone=public --add-port=5173/tcp --permanent
    sudo firewall-cmd --zone=public --add-port=4173/tcp --permanent
    sudo firewall-cmd --reload
    echo "✅ Da mo port tren Firewalld!"
else
    echo "Khong tim thay UFW hay Firewalld. Co the VPS cua ban dang dung iptables hoac tuong lua cua nha cung cap."
fi

echo ""
echo "========================================="
echo "Luu y: Doi voi AWS/Azure/Google Cloud/Tencent Cloud, ban phai vao Control Panel (Web) cua nha cung cap de mo rule cho Security Group!"
echo "========================================="
