const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seed() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    
    // Check if admin exists
    const [rows] = await pool.execute('SELECT email FROM users WHERE email = ?', ['admin@gmail.com']);
    if (rows.length === 0) {
      await pool.execute(
        'INSERT INTO users (id, email, password_hash, role, fullName) VALUES (?, ?, ?, ?, ?)',
        ['seed_admin', 'admin@gmail.com', hash, 'admin', 'Admin Tổng']
      );
      console.log('Đã tạo tài khoản admin: admin@gmail.com / password123');
    }
    
    // Check if employee exists
    const [empRows] = await pool.execute('SELECT email FROM users WHERE email = ?', ['nhanvien@gmail.com']);
    if (empRows.length === 0) {
      await pool.execute(
        'INSERT INTO users (id, email, password_hash, role, fullName) VALUES (?, ?, ?, ?, ?)',
        ['seed_emp', 'nhanvien@gmail.com', hash, 'employee', 'Nguyễn Văn Nhân Viên']
      );
      console.log('Đã tạo tài khoản nhân viên: nhanvien@gmail.com / password123');
    }
    
    console.log('Hoàn tất tạo tài khoản mẫu!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
