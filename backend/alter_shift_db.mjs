import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chamcong_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function run() {
  try {
    console.log("Creating daily_shifts table...");
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS daily_shifts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        date VARCHAR(10) NOT NULL,
        shift_id VARCHAR(50) NOT NULL,
        UNIQUE KEY unique_user_date (userId, date)
      )
    `);

    console.log("Adding columns to requests table...");
    try {
      await pool.execute('ALTER TABLE requests ADD COLUMN targetUserId VARCHAR(255) DEFAULT NULL');
      await pool.execute('ALTER TABLE requests ADD COLUMN targetUserName VARCHAR(255) DEFAULT NULL');
    } catch (e) {
      console.log("Columns might already exist: " + e.message);
    }
    
    console.log("Database updated successfully.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

run();
