#!/bin/bash
echo "========================================="
echo "   Auto Setup & Deploy ChamCong trên VPS"
echo "========================================="

echo "[1/4] Cài đặt thư viện (Dependencies)..."
echo "-> Frontend..."
npm install
echo "-> Backend..."
cd backend
npm install
cd ..

echo "[2/4] Khởi tạo Database MySQL..."
cd backend
node setup_db.js
cd ..

echo "[3/4] Build Web Frontend..."
npm run build

echo "[4/4] Khởi động ứng dụng với PM2..."
# Cài đặt pm2 nếu chưa có
if ! command -v pm2 &> /dev/null
then
    echo "Đang cài đặt PM2..."
    npm install -g pm2
fi

# Chạy Backend
cd backend
pm2 start server.js --name "chamcong-backend"
cd ..

# Chạy Frontend (Preview)
pm2 start "npm run preview" --name "chamcong-frontend"

echo "========================================="
echo "✅ Hoàn tất! Ứng dụng đã được chạy ngầm bởi PM2."
echo "Truy cập Frontend ở cổng 4173 và Backend ở cổng 5000."
echo "Sử dụng lệnh 'pm2 status' để xem trạng thái."
echo "========================================="
