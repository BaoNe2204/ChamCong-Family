import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function addPushTokenColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chamcong_family'
  });

  try {
    console.log("Dang them cot pushToken vao bang users...");
    await connection.query("ALTER TABLE users ADD COLUMN pushToken VARCHAR(255);");
    console.log("Them thanh cong!");
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Cot pushToken da ton tai, khong can them.");
    } else {
      console.error("Loi:", error.message);
    }
  } finally {
    await connection.end();
  }
}

addPushTokenColumn();
