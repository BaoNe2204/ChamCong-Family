import pool from './backend/db.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function createUser() {
  const email = 'nhanvien@gmail.com';
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await pool.execute(
    'INSERT IGNORE INTO users (id, email, password, fullName, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), email, hashedPassword, 'Nhân Viên Test', '0987654321', 'employee']
  );
  console.log('Tạo tài khoản thành công!');
  process.exit(0);
}

createUser();
