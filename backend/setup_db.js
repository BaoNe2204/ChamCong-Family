const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  try {
    console.log('Đang kết nối tới MySQL...');
    // Tạo connection không có database để có thể chạy CREATE DATABASE
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('Đang đọc file init_db.sql...');
    const sqlScript = fs.readFileSync(path.join(__dirname, 'init_db.sql'), 'utf8');

    console.log('Đang thực thi các câu lệnh SQL để khởi tạo Database...');
    await connection.query(sqlScript);

    console.log('✅ Khởi tạo Database thành công!');
    await connection.end();
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo Database:', error.message);
    process.exit(1);
  }
}

initDB();
