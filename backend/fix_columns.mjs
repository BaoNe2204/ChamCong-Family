import pool from './db.js';

async function checkAndFixDb() {
  try {
    const [rows] = await pool.query("SHOW COLUMNS FROM attendance LIKE 'userName'");
    if (rows.length === 0) {
      console.log("Missing userName in attendance, adding...");
      await pool.query("ALTER TABLE attendance ADD COLUMN userName VARCHAR(255) AFTER userId");
    }
    
    const [rows2] = await pool.query("SHOW COLUMNS FROM requests LIKE 'userName'");
    if (rows2.length === 0) {
      console.log("Missing userName in requests, adding...");
      await pool.query("ALTER TABLE requests ADD COLUMN userName VARCHAR(255) AFTER userId");
    }
    
    const [rows3] = await pool.query("SHOW COLUMNS FROM requests LIKE 'targetUserName'");
    if (rows3.length === 0) {
      console.log("Missing targetUserName in requests, adding...");
      await pool.query("ALTER TABLE requests ADD COLUMN targetUserName VARCHAR(255) AFTER targetUserId");
    }

    console.log("Database schema is up to date!");
  } catch (err) {
    console.error("DB Check Error:", err);
  } finally {
    process.exit(0);
  }
}

checkAndFixDb();
