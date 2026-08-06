const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Middleware for auth
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admin only." });
  }
};

// --- HELPER FUNCTIONS ---
const getVietnamDateString = (dateObj = new Date()) => {
  const tzOffset = 7 * 60 * 60 * 1000; // Vietnam is UTC+7
  const localDate = new Date(dateObj.getTime() + tzOffset);
  return localDate.toISOString().split('T')[0];
};

// --- AUTH APIs ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Basic check
    if (!email || !password) return res.status(400).json({ error: "Thiếu email hoặc mật khẩu" });
    
    // Hash
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    // Check role from email logic
    const role = (email.includes('admin') || email.includes('quanly')) ? 'admin' : 'employee';
    const id = Date.now().toString(); // simple id gen
    
    const [result] = await pool.execute(
      'INSERT INTO users (id, email, password_hash, role, fullName) VALUES (?, ?, ?, ?, ?)',
      [id, email, hash, role, email.split('@')[0]]
    );
    
    res.json({ message: "Đăng ký thành công" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: "Email đã tồn tại" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
    
    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
    
    // Generate JWT
    const token = jwt.sign(
      { uid: user.id, email: user.email, role: user.role, fullName: user.fullName }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { uid: user.id, email: user.email, role: user.role, fullName: user.fullName } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id as uid, email, role, fullName, phone FROM users WHERE id = ?', [req.user.uid]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    await pool.execute('UPDATE users SET fullName = ?, phone = ? WHERE id = ?', [fullName, phone, req.user.uid]);
    res.json({ message: "Cập nhật thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user hash
    const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.uid]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    
    const validPassword = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!validPassword) return res.status(400).json({ error: "Mật khẩu hiện tại không đúng" });
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.uid]);
    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ATTENDANCE APIs ---
app.post('/api/attendance/checkin', authenticateToken, async (req, res) => {
  try {
    const today = getVietnamDateString();
    
    // Check if already checked in today
    const [existing] = await pool.execute(
      'SELECT id FROM attendance WHERE userId = ? AND date = ?',
      [req.user.uid, today]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: "Bạn đã check in hôm nay rồi!" });
    }
    
    await pool.execute(
      'INSERT INTO attendance (userId, userName, date, checkInTimeMillis) VALUES (?, ?, ?, ?)',
      [req.user.uid, req.user.email, today, Date.now()]
    );
    
    res.json({ message: "Check in thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance/checkout', authenticateToken, async (req, res) => {
  try {
    const today = getVietnamDateString();
    
    const [existing] = await pool.execute(
      'SELECT id, checkInTimeMillis FROM attendance WHERE userId = ? AND date = ?',
      [req.user.uid, today]
    );
    
    if (existing.length === 0) {
      return res.status(400).json({ error: "Chưa check in hôm nay!" });
    }
    
    const record = existing[0];
    const checkOutTimeMillis = Date.now();
    const durationMs = checkOutTimeMillis - record.checkInTimeMillis;
    const totalHours = (durationMs / (1000 * 60 * 60)).toFixed(2);
    
    // Get shift end from settings
    const [settings] = await pool.execute('SELECT setting_value FROM settings WHERE setting_key = "general"');
    const shiftSettings = JSON.parse(settings[0].setting_value);
    
    const nowStr = new Date().toLocaleTimeString('en-US', {hour12:false, timeZone: 'Asia/Ho_Chi_Minh'});
    const isValidShift = nowStr >= shiftSettings.shiftEnd;
    
    await pool.execute(
      'UPDATE attendance SET checkOutTimeMillis = ?, totalHours = ?, isValidShift = ? WHERE id = ?',
      [checkOutTimeMillis, parseFloat(totalHours), isValidShift, record.id]
    );
    
    res.json({ message: "Check out thành công", totalHours, isValidShift });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/attendance/history', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM attendance WHERE userId = ? ORDER BY date DESC',
      [req.user.uid]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/attendance/today', authenticateToken, async (req, res) => {
  try {
    const today = getVietnamDateString();
    const [rows] = await pool.execute(
      'SELECT * FROM attendance WHERE userId = ? AND date = ?',
      [req.user.uid, today]
    );
    res.json(rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/attendance/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const dateObj = new Date();
    const currentMonth = dateObj.getMonth() + 1; // 1-12
    const currentYear = dateObj.getFullYear();
    const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}%`;

    // 1. Total Working Days this month
    const [daysRows] = await pool.execute(
      'SELECT COUNT(DISTINCT date) as totalDays FROM attendance WHERE userId = ? AND date LIKE ?',
      [userId, currentMonthStr]
    );
    const totalWorkDays = daysRows[0].totalDays || 0;

    // 2. Total Hours this month
    const [hoursRows] = await pool.execute(
      'SELECT SUM(totalHours) as totalHours FROM attendance WHERE userId = ? AND date LIKE ?',
      [userId, currentMonthStr]
    );
    const totalHours = hoursRows[0].totalHours ? parseFloat(hoursRows[0].totalHours).toFixed(1) : 0;

    // 3. Last 7 Days Chart Data
    const [chartRows] = await pool.execute(
      'SELECT date, totalHours FROM attendance WHERE userId = ? ORDER BY date DESC LIMIT 7',
      [userId]
    );
    
    // Reverse to make it chronological
    const chartData = chartRows.reverse().map(row => ({
      name: new Date(row.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }),
      hours: row.totalHours ? parseFloat(row.totalHours) : 0
    }));

    // Dummy data for empty case
    const finalChartData = chartData.length > 0 ? chartData : [
      { name: 'T2', hours: 0 }, { name: 'T3', hours: 0 }, { name: 'T4', hours: 0 }
    ];

    res.json({
      totalWorkDays,
      totalHours,
      chartData: finalChartData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/attendance/dashboard-full', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const dateObj = new Date();
    const today = getVietnamDateString(dateObj);
    const vnDate = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);
    const currentMonthStr = `${vnDate.getUTCFullYear()}-${(vnDate.getUTCMonth() + 1).toString().padStart(2, '0')}%`;

    // 1. Get user base salary
    const [userRows] = await pool.execute('SELECT baseSalary FROM users WHERE id = ?', [userId]);
    const baseSalary = userRows[0]?.baseSalary || 6000000;

    // 2. Get Settings
    const [settingsRows] = await pool.execute('SELECT setting_value FROM settings WHERE setting_key = "general"');
    const settings = settingsRows.length > 0 ? JSON.parse(settingsRows[0].setting_value) : { shiftStart: "08:00", shiftEnd: "17:00" };

    // 3. Get Today's Status
    const [todayRows] = await pool.execute('SELECT * FROM attendance WHERE userId = ? AND date = ?', [userId, today]);
    const todayRecord = todayRows[0] || null;

    // 4. Get Last 5 Days History
    const [historyRows] = await pool.execute(
      'SELECT date, checkInTimeMillis, checkOutTimeMillis, totalHours FROM attendance WHERE userId = ? ORDER BY date DESC LIMIT 5',
      [userId]
    );

    // 5. Monthly Stats
    const [monthRows] = await pool.execute(
      'SELECT date, checkInTimeMillis, totalHours FROM attendance WHERE userId = ? AND date LIKE ?',
      [userId, currentMonthStr]
    );

    let onTime = 0;
    let late = 0;
    let totalHoursMonth = 0;

    // Calculate late vs on-time
    const shiftStartTime = new Date(`1970-01-01T${settings.shiftStart}:00Z`).getTime(); // approximate for comparison if using only hours/mins, but better to compare HH:mm strings

    monthRows.forEach(row => {
      const checkInDate = new Date(row.checkInTimeMillis);
      const checkInStr = checkInDate.toLocaleTimeString('en-US', {hour12:false, timeZone: 'Asia/Ho_Chi_Minh'});
      // If checkIn > shiftStart (e.g. 08:05 > 08:00), it's late.
      // Note: simple string comparison works for HH:mm:ss if same format
      if (checkInStr > (settings.shiftStart + ":00")) {
        late++;
      } else {
        onTime++;
      }
      totalHoursMonth += parseFloat(row.totalHours || 0);
    });

    // 6. Calculate OT and Salary
    // Standard working hours per month = 26 days * 8 hours = 208 hours
    // Simplified: Any hours over 8 per day is OT.
    let otHours = 0;
    monthRows.forEach(row => {
      if (row.totalHours > 8) {
        otHours += (row.totalHours - 8);
      }
    });

    const hourlyRate = baseSalary / 26 / 8;
    const otRate = hourlyRate * 1.5;
    
    // Salary = (base / 26) * (onTime + late) + OT
    const workDays = monthRows.length;
    const calculatedSalary = (baseSalary / 26) * workDays;
    const calculatedOT = otHours * otRate;
    const totalSalary = calculatedSalary + calculatedOT;
    
    const daysOff = Math.max(0, 26 - workDays);

    res.json({
      settings,
      baseSalary,
      todayRecord,
      history: historyRows,
      stats: {
        onTime,
        late,
        daysOff,
        otHours: parseFloat(otHours.toFixed(1)),
        totalHoursMonth: parseFloat(totalHoursMonth.toFixed(1)),
        calculatedSalary: Math.round(calculatedSalary),
        calculatedOT: Math.round(calculatedOT),
        totalSalary: Math.round(totalSalary)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- REQUESTS APIs ---
app.post('/api/requests', authenticateToken, async (req, res) => {
  try {
    const { type, date, reason } = req.body;
    if (!type || !date || !reason) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin (type, date, reason)" });
    }
    
    await pool.execute(
      'INSERT INTO requests (userId, userName, type, date, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.uid, req.user.email, type, date, reason, 'pending']
    );
    
    res.json({ message: "Gửi đơn thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/requests/my', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM requests WHERE userId = ? ORDER BY createdAt DESC',
      [req.user.uid]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ADMIN USERS APIs ---
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, email, fullName, role, phone FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: "Đã xoá nhân viên" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SETTINGS APIs ---
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT setting_value FROM settings WHERE setting_key = "general"');
    if (rows.length > 0) {
      res.json(JSON.parse(rows[0].setting_value));
    } else {
      res.json({});
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const valueStr = JSON.stringify(req.body);
    await pool.execute(
      'INSERT INTO settings (setting_key, setting_value) VALUES ("general", ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [valueStr, valueStr]
    );
    res.json({ message: "Đã lưu cấu hình" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- REQUESTS APIs ---
app.get('/api/requests', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM requests ORDER BY createdAt DESC';
    let params = [];
    if (req.user.role !== 'admin') {
      query = 'SELECT * FROM requests WHERE userId = ? ORDER BY createdAt DESC';
      params = [req.user.uid];
    }
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/requests', authenticateToken, async (req, res) => {
  try {
    const { type, date, reason } = req.body;
    await pool.execute(
      'INSERT INTO requests (userId, userName, type, date, reason) VALUES (?, ?, ?, ?, ?)',
      [req.user.uid, req.user.email, type, date, reason]
    );
    res.json({ message: "Nộp đơn thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/requests/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, adminNote, userId } = req.body;
    await pool.execute(
      'UPDATE requests SET status = ?, adminNote = ? WHERE id = ?',
      [status, adminNote, req.params.id]
    );
    
    // Create notification
    await pool.execute(
      'INSERT INTO notifications (userId, title, message) VALUES (?, ?, ?)',
      [userId, `Đơn của bạn đã bị ${status === 'approved' ? 'duyệt' : 'từ chối'}`, `Phản hồi: ${adminNote || 'Không có'}`]
    );
    
    res.json({ message: "Cập nhật đơn thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- NOTIFICATIONS APIs ---
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC',
      [req.user.uid]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/read', authenticateToken, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE notifications SET isRead = TRUE WHERE userId = ? AND isRead = FALSE',
      [req.user.uid]
    );
    res.json({ message: "Đã đánh dấu đọc" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
