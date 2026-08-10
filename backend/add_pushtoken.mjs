import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fixDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chamcong_family'
  });

  const queries = [
    "ALTER TABLE users ADD COLUMN pushToken VARCHAR(255);",
    "ALTER TABLE attendance ADD COLUMN checkInPhoto TEXT;",
    "ALTER TABLE attendance ADD COLUMN checkOutPhoto TEXT;",
    "ALTER TABLE requests ADD COLUMN targetUserId VARCHAR(255);",
    "ALTER TABLE requests ADD COLUMN targetUserName VARCHAR(255);",
    `CREATE TABLE IF NOT EXISTS daily_shifts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      shift_id VARCHAR(50) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_daily_shift (userId, date),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );`
  ];

  try {
    console.log("Dang kiem tra va cap nhat toan bo co so du lieu...");
    for (const query of queries) {
      try {
        await connection.query(query);
        console.log("Thanh cong:", query.split('(')[0].substring(0, 50));
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log("Da ton tai (bo qua):", query.split('(')[0].substring(0, 50));
        } else {
          console.error("Loi khi chay:", query, error.message);
        }
      }
    }
    console.log("Cap nhat hoan tat!");
  } finally {
    await connection.end();
  }
}

fixDatabase();
