const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const pool = require('./db');
const { setupCronJobs } = require('./cronJobs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'public/uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// Start cron jobs
setupCronJobs(pool);

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
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id as uid, email, role, fullName, phone, shift_id FROM users WHERE id = ?', [req.user.uid]);
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

// Update push token
app.post('/api/users/push-token', authenticateToken, async (req, res) => {
  try {
    const { pushToken } = req.body;
    await pool.execute(
      'UPDATE users SET pushToken = ? WHERE id = ?',
      [pushToken, req.user.uid]
    );
    res.json({ message: "Lưu push token thành công" });
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

// --- SETTINGS APIs ---
app.get('/api/settings/:key', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT setting_value FROM settings WHERE setting_key = ?', [req.params.key]);
    if (rows.length === 0) return res.status(404).json({ error: "Settings not found" });
    let value = rows[0].setting_value;
    if (typeof value === 'string') {
      try { value = JSON.parse(value); } catch(e) {}
    }
    res.json(value);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/:key', authenticateToken, isAdmin, async (req, res) => {
  try {
    const value = req.body;
    // Insert or update (UPSERT)
    await pool.execute(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [req.params.key, JSON.stringify(value), JSON.stringify(value)]
    );
    res.json({ message: "Cập nhật cấu hình thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ATTENDANCE APIs ---
app.get('/api/attendance/check-network', authenticateToken, async (req, res) => {
  try {
    const [settingRows] = await pool.execute('SELECT setting_value FROM settings WHERE setting_key = "general"');
    if (settingRows.length === 0) {
      return res.json({ requireWifi: false, isConnected: true });
    }
    let settings = settingRows[0].setting_value;
    if (typeof settings === 'string') {
      try { settings = JSON.parse(settings); } catch(e) {}
    }

    if (settings.requireWifi && settings.wifiIp && settings.wifiIp.trim() !== '') {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      const cleanClientIp = clientIp.includes('::ffff:') ? clientIp.split('::ffff:')[1] : clientIp;
      const targetIp = settings.wifiIp.trim();
      
      if (cleanClientIp !== targetIp) {
        return res.json({ requireWifi: true, isConnected: false, ip: cleanClientIp });
      } else {
        return res.json({ requireWifi: true, isConnected: true, ip: cleanClientIp });
      }
    }
    
    return res.json({ requireWifi: false, isConnected: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance/checkin', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const photoPath = req.file ? '/uploads/' + req.file.filename : null;
    
    // 1. Lấy cấu hình hệ thống
    const [settingRows] = await pool.execute('SELECT setting_value FROM settings WHERE setting_key = "general"');
    if (settingRows.length === 0) {
      return res.status(500).json({ error: "Chưa cấu hình hệ thống" });
    }
    let settings = settingRows[0].setting_value;
    if (typeof settings === 'string') {
      try { settings = JSON.parse(settings); } catch(e) {}
    }
    
    // 2. Xác thực WiFi (IP Công ty)
      if (settings.requireWifi && settings.wifiIp && settings.wifiIp.trim() !== '') {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
        const cleanClientIp = clientIp.includes('::ffff:') ? clientIp.split('::ffff:')[1] : clientIp;
        const targetIp = settings.wifiIp.trim();
        
        if (cleanClientIp !== targetIp) {
          return res.status(403).json({ error: `Bảo mật: Vui lòng kết nối WiFi công ty để chấm công. (IP của bạn: ${cleanClientIp})` });
        }
      }
    
    // 3. Xác thực GPS (Haversine)
    if (!lat || !lng) {
      return res.status(400).json({ error: "Thiếu tọa độ GPS" });
    }
    const R = 6371e3; // metres
    const dLat = (settings.factoryLat - lat) * Math.PI / 180;
    const dLon = (settings.factoryLng - lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat * Math.PI / 180) * Math.cos(settings.factoryLat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance > settings.maxDistance) {
      return res.status(403).json({ error: `Bạn đang ở quá xa công ty (Cách ${Math.round(distance)}m). Không thể chấm công.` });
    }

    const today = getVietnamDateString();
    
    // 4. Lấy shift_id hiện tại của user (Kiểm tra xem hôm nay có đổi ca không)
    const [dailyRows] = await pool.execute('SELECT shift_id FROM daily_shifts WHERE userId = ? AND date = ?', [req.user.uid, today]);
    let shift_id = 'shift_1';
    
    if (dailyRows.length > 0) {
      shift_id = dailyRows[0].shift_id;
    } else {
      const [userRows] = await pool.execute('SELECT shift_id FROM users WHERE id = ?', [req.user.uid]);
      shift_id = userRows[0]?.shift_id || 'shift_1';
    }

    // 5. Kiểm tra có phiên nào trong hôm nay chưa (Chỉ 1 ca/ngày)
    const [existingToday] = await pool.execute(
      'SELECT id, checkOutTimeMillis FROM attendance WHERE userId = ? AND date = ?',
      [req.user.uid, today]
    );
    
    if (existingToday.length > 0) {
      // Đã có record hôm nay
      const hasOpenSession = existingToday.some(r => r.checkOutTimeMillis === null);
      if (hasOpenSession) {
        return res.status(400).json({ error: "Bạn đang có một phiên làm việc chưa check-out!" });
      } else {
        return res.status(400).json({ error: "Bạn đã hoàn thành ca làm việc hôm nay rồi. Không thể check-in thêm!" });
      }
    }
    
    // 6. Tính toán đi trễ (late_minutes) và chặn Check-in sớm
    let late_minutes = 0;
    const currentShift = settings.shifts?.find(s => s.id === shift_id) || settings.shifts?.[0];
    if (currentShift) {
      const now = new Date();
      const [sh, sm] = currentShift.startTime.split(':');
      const shiftStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(sh), Number(sm), 0);
      
      const diffMs = now.getTime() - shiftStartDate.getTime();
      
      // Chặn check-in sớm quá 30 phút
      if (diffMs < -30 * 60 * 1000) {
        return res.status(403).json({ error: `Chưa đến giờ làm việc. Bạn chỉ được Check-in sớm tối đa 30 phút trước ca (${currentShift.startTime}).` });
      }

      const [eh, em] = currentShift.endTime.split(':');
      const shiftEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(eh), Number(em), 0);
      
      // Chặn check-in nếu đã qua giờ kết thúc ca
      if (now.getTime() > shiftEndDate.getTime()) {
        return res.status(403).json({ error: `Ca làm việc của bạn (${currentShift.startTime} - ${currentShift.endTime}) đã kết thúc. Không thể Check-in nữa.` });
      }

      if (diffMs > 0) { // Đi trễ
        // Chặn check-in trễ quá 30 phút
        if (diffMs > 30 * 60 * 1000) {
          return res.status(403).json({ error: `Đã quá thời gian cho phép Check-in (Tối đa trễ 30 phút so với ${currentShift.startTime}). Bạn không thể Check-in ca này nữa.` });
        }
        late_minutes = Math.floor(diffMs / 60000);
      }
    }

    // 7. Tạo phiên mới
    await pool.execute(
      'INSERT INTO attendance (userId, userName, date, shift_id, checkInTimeMillis, status, late_minutes, checkInPhoto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.uid, req.user.email, today, shift_id, Date.now(), 'PRESENT', late_minutes, photoPath]
    );
    
    res.json({ message: "Check-in thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance/checkout', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const photoPath = req.file ? '/uploads/' + req.file.filename : null;
    // 1. Tìm phiên đang mở
    const [existing] = await pool.execute(
      'SELECT * FROM attendance WHERE userId = ? AND checkOutTimeMillis IS NULL ORDER BY checkInTimeMillis DESC LIMIT 1',
      [req.user.uid]
    );
    
    if (existing.length === 0) {
      return res.status(400).json({ error: "Không tìm thấy phiên làm việc nào chưa check-out!" });
    }
    
    const record = existing[0];
    const checkOutTimeMillis = Date.now();
    const durationMs = checkOutTimeMillis - record.checkInTimeMillis;
    const totalHours = (durationMs / (1000 * 60 * 60));
    
    // 2. Đọc cấu hình ca làm việc
    const [settingsRows] = await pool.execute('SELECT setting_value FROM settings WHERE setting_key = "general"');
    const settings = settingsRows.length > 0 ? JSON.parse(settingsRows[0].setting_value) : {};
    
    const currentShift = settings.shifts?.find(s => s.id === record.shift_id) || settings.shifts?.[0];
    
    let overtime_hours = 0;
    let early_leave_minutes = 0;
    let status = record.status || 'PRESENT';

    if (currentShift) {
      const checkInDate = new Date(record.checkInTimeMillis);
      const checkOutDate = new Date(checkOutTimeMillis);
      
      const [sh, sm] = currentShift.startTime.split(':');
      const [eh, em] = currentShift.endTime.split(':');
      
      let shiftStartDate = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), Number(sh), Number(sm), 0);
      let shiftEndDate = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), Number(eh), Number(em), 0);
      
      // Handle overnight shift
      if (shiftEndDate < shiftStartDate) {
        shiftEndDate.setDate(shiftEndDate.getDate() + 1);
      }
      
      // Tính về sớm (Early leave)
      if (checkOutDate < shiftEndDate) {
        early_leave_minutes = Math.floor((shiftEndDate.getTime() - checkOutDate.getTime()) / 60000);
      }
      
      // Tính overtime: tính theo số giờ làm việc thực tế sau khi hết ca, 
      let actualOTStartTime = shiftEndDate;
      if (checkInDate > shiftEndDate) {
          actualOTStartTime = checkInDate;
      }
      if (checkOutDate > actualOTStartTime) {
        overtime_hours = (checkOutDate.getTime() - actualOTStartTime.getTime()) / 3600000;
      }

      // Đánh giá lại trạng thái
      if (early_leave_minutes > 0 && record.late_minutes > 0) {
         // Vừa trễ vừa sớm
         status = 'LATE'; // Ưu tiên LATE hoặc tuỳ logic
      } else if (early_leave_minutes > 0) {
         status = 'EARLY_LEAVE';
      } else if (overtime_hours > 0) {
         status = 'OT';
      }
    }
    
    let isValidShift = 1;
    const minHoursForValidShift = settings.minHoursForValidShift !== undefined ? parseFloat(settings.minHoursForValidShift) : 0;
    
    if (totalHours < minHoursForValidShift) {
      isValidShift = 0;
      status = 'INVALID_SHORT';
    }

    await pool.execute(
      'UPDATE attendance SET checkOutTimeMillis = ?, totalHours = ?, overtime_hours = ?, early_leave_minutes = ?, status = ?, isValidShift = ?, checkOutPhoto = ? WHERE id = ?',
      [checkOutTimeMillis, totalHours.toFixed(2), overtime_hours.toFixed(2), early_leave_minutes, status, isValidShift, photoPath, record.id]
    );
    
    res.json({ message: "Check-out thành công", totalHours: totalHours.toFixed(2), status });
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

app.get('/api/attendance/my-schedule', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const dateObj = new Date();
    const currentYear = dateObj.getFullYear();
    const currentMonth = dateObj.getMonth() + 1;
    const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}%`;

    // Lấy default shift
    const [userRows] = await pool.execute('SELECT shift_id FROM users WHERE id = ?', [userId]);
    const defaultShiftId = userRows[0]?.shift_id || 'shift_1';

    // Lấy daily_shifts trong tháng
    const [dailyRows] = await pool.execute(
      'SELECT date, shift_id FROM daily_shifts WHERE userId = ? AND date LIKE ?',
      [userId, currentMonthStr]
    );

    res.json({
      defaultShiftId,
      dailyShifts: dailyRows
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

    // 1. Get user info
    const [userRows] = await pool.execute('SELECT email, fullName, role, hourlyRate FROM users WHERE id = ?', [userId]);
    const userInfo = userRows[0] || {};
    const baseSalary = 6000000;

    // 2. Get Settings
    const [settingsRows] = await pool.execute('SELECT setting_value FROM settings WHERE setting_key = "general"');
    const settings = settingsRows.length > 0 ? JSON.parse(settingsRows[0].setting_value) : { shiftStart: "08:00", shiftEnd: "17:00" };

    // 3. Get Today's Status (Latest session)
    const [todayRows] = await pool.execute('SELECT * FROM attendance WHERE userId = ? AND date = ? ORDER BY checkInTimeMillis DESC LIMIT 1', [userId, today]);
    const todayRecord = todayRows[0] || null;

    // 4. Get Last 5 Days History
    const [historyRows] = await pool.execute(
      'SELECT * FROM attendance WHERE userId = ? ORDER BY date DESC LIMIT 5',
      [userId]
    );

    // 5. Get Unread Notifications Count
    const [notifRows] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = FALSE',
      [userId]
    );
    const unreadCount = notifRows[0]?.count || 0;

    // 5. Monthly Stats
    const [monthRows] = await pool.execute(
      'SELECT date, status, late_minutes, early_leave_minutes, overtime_hours, checkInTimeMillis, checkOutTimeMillis, totalHours FROM attendance WHERE userId = ? AND date LIKE ?',
      [userId, currentMonthStr]
    );

    let onTime = 0;
    let late = 0;
    let totalHoursMonth = 0;
    let otHours = 0;

    // Group by date to handle multiple sessions per day
    const daysMap = {};
    monthRows.forEach(row => {
      const dateStr = typeof row.date === 'string' ? row.date : row.date.toISOString().split('T')[0];
      if (!daysMap[dateStr]) {
         daysMap[dateStr] = { late_minutes: 0, early_leave_minutes: 0, totalHours: 0, overtime_hours: 0, isLate: false };
      }
      daysMap[dateStr].late_minutes += (row.late_minutes || 0);
      daysMap[dateStr].early_leave_minutes += (row.early_leave_minutes || 0);
      daysMap[dateStr].totalHours += parseFloat(row.totalHours || 0);
      daysMap[dateStr].overtime_hours += parseFloat(row.overtime_hours || 0);
      if (row.status === 'LATE' || row.late_minutes > 0) {
         daysMap[dateStr].isLate = true;
      }
    });

    Object.values(daysMap).forEach(day => {
      if (day.isLate) {
        late++;
      } else {
        onTime++;
      }
      totalHoursMonth += day.totalHours;
      otHours += day.overtime_hours;
    });

    const shiftRate = 200000;
    const hourlyRate = shiftRate / 8;
    const otRate = hourlyRate * 1.5;
    
    const workDays = monthRows.length;
    const calculatedSalary = workDays * shiftRate;
    const calculatedOT = otHours * otRate;
    const totalSalary = calculatedSalary + calculatedOT;
    
    const daysOff = Math.max(0, 26 - workDays);

    res.json({
      settings,
      baseSalary,
      userInfo,
      unreadCount,
      todayRecord,
      history: historyRows,
      stats: {
        onTime,
        late,
        daysOff,
        otHours: parseFloat(otHours.toFixed(1)),
        totalHoursMonth: parseFloat(totalHoursMonth.toFixed(1)),
        totalShiftsMonth: monthRows.length,
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
    const { type, date, reason, targetUserId, targetUserName } = req.body;
    if (!type || !date || !reason) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin (type, date, reason)" });
    }
    
    await pool.execute(
      'INSERT INTO requests (userId, userName, type, date, reason, status, targetUserId, targetUserName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.uid, req.user.email, type, date, reason, 'pending', targetUserId || null, targetUserName || null]
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

app.get('/api/employees/list', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, fullName, email FROM users WHERE id != ?', [req.user.uid]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ADMIN USERS APIs ---
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, email, fullName, role, phone, shift_id, hourlyRate FROM users');
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

app.post('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { email, password, fullName, phone, role, shift_id, hourlyRate } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Thiếu email hoặc mật khẩu" });
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const id = Date.now().toString();
    
    await pool.execute(
      'INSERT INTO users (id, email, password_hash, role, fullName, phone, shift_id, hourlyRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, email, hash, role || 'employee', fullName || '', phone || '', shift_id || 'shift_1', hourlyRate || 0]
    );
    
    res.json({ message: "Thêm nhân viên thành công" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: "Email đã tồn tại" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.put('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { fullName, phone, role, password, shift_id, hourlyRate } = req.body;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      await pool.execute(
        'UPDATE users SET fullName = ?, phone = ?, role = ?, password_hash = ?, shift_id = ?, hourlyRate = ? WHERE id = ?',
        [fullName, phone, role, hash, shift_id || 'shift_1', hourlyRate || 0, req.params.id]
      );
    } else {
      await pool.execute(
        'UPDATE users SET fullName = ?, phone = ?, role = ?, shift_id = ?, hourlyRate = ? WHERE id = ?',
        [fullName, phone, role, shift_id || 'shift_1', hourlyRate || 0, req.params.id]
      );
    }
    
    res.json({ message: "Cập nhật nhân viên thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/attendance/payroll/:month/:year', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.params;
    const userId = req.user.uid;
    
    // Get user details
    const [users] = await pool.execute('SELECT hourlyRate FROM users WHERE id = ?', [userId]);
    const hourlyRate = users[0]?.hourlyRate || 0;
    
    // Get all attendance records for the month
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDateObj = new Date(year, month, 0);
    const endDate = `${year}-${month.padStart(2, '0')}-${endDateObj.getDate().toString().padStart(2, '0')}`;
    
    const [attendance] = await pool.execute(
      'SELECT date, totalHours, isValidShift FROM attendance WHERE userId = ? AND date >= ? AND date <= ? AND checkOutTimeMillis IS NOT NULL',
      [userId, startDate, endDate]
    );

    const daysMap = {};
    attendance.forEach(record => {
       const d = typeof record.date === 'string' ? record.date : record.date.toISOString().split('T')[0];
       if (!daysMap[d]) {
          daysMap[d] = { totalHours: 0, isValid: true };
       }
       daysMap[d].totalHours += parseFloat(record.totalHours || 0);
       if (!record.isValidShift) daysMap[d].isValid = false;
    });

    const totalDays = Object.keys(daysMap).length;
    let totalHours = 0;
    let validDays = 0;
    let errorDays = 0;
    
    Object.values(daysMap).forEach(day => {
      totalHours += day.totalHours;
      if (day.isValid) validDays++;
      else errorDays++;
    });
    
    const shiftRate = 200000;
    const salary = validDays * shiftRate;
    
    res.json({
      hourlyRate,
      totalDays,
      validDays,
      errorDays,
      totalHours: Math.round(totalHours * 10) / 10,
      salary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/payroll/:month/:year', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { month, year } = req.params;
    
    // Get settings for otMultiplier
    const [settingRows] = await pool.execute('SELECT setting_value FROM settings WHERE setting_key = "general"');
    let otMultiplier = 1.5;
    if (settingRows.length > 0) {
      try {
        const settings = JSON.parse(settingRows[0].setting_value);
        if (settings.otMultiplier) otMultiplier = parseFloat(settings.otMultiplier);
      } catch(e) {}
    }

    // Get all users except admin
    const [users] = await pool.execute('SELECT id, email, fullName, role, hourlyRate FROM users WHERE role != "admin"');
    
    // Get payroll adjustments
    const [adjustments] = await pool.execute(
      'SELECT * FROM payroll_adjustments WHERE month = ? AND year = ?',
      [month, year]
    );
    
    // Get all attendance records for the month
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    // Last day of month
    const endDateObj = new Date(year, month, 0);
    const endDate = `${year}-${month.padStart(2, '0')}-${endDateObj.getDate().toString().padStart(2, '0')}`;
    
    const [attendance] = await pool.execute(
      'SELECT userId, date, totalHours, overtime_hours, isValidShift FROM attendance WHERE date >= ? AND date <= ? AND checkOutTimeMillis IS NOT NULL',
      [startDate, endDate]
    );

    // Calculate payroll for each user
    const payrollList = users.map(user => {
      const userRecords = attendance.filter(a => a.userId === user.id);
      
      const daysMap = {};
      userRecords.forEach(record => {
         const d = typeof record.date === 'string' ? record.date : record.date.toISOString().split('T')[0];
         if (!daysMap[d]) {
            daysMap[d] = { totalHours: 0, overtimeHours: 0, isValid: true };
         }
         daysMap[d].totalHours += parseFloat(record.totalHours || 0);
         daysMap[d].overtimeHours += parseFloat(record.overtime_hours || 0);
         if (!record.isValidShift) daysMap[d].isValid = false;
      });

      const totalDays = Object.keys(daysMap).length;
      let totalHours = 0;
      let overtimeHours = 0;
      let validDays = 0;
      let errorDays = 0;
      
      Object.values(daysMap).forEach(day => {
        totalHours += day.totalHours;
        overtimeHours += day.overtimeHours;
        if (day.isValid) validDays++;
        else errorDays++;
      });
      
      const baseHours = Math.max(0, totalHours - overtimeHours);
      
      const userAdj = adjustments.find(adj => adj.userId === user.id) || {};
      const manualOtHours = parseFloat(userAdj.manualOtHours || 0);
      const bonus = parseInt(userAdj.bonus || 0);
      const penalty = parseInt(userAdj.penalty || 0);
      const finalHourlyRate = userAdj.hourlyRate !== undefined && userAdj.hourlyRate !== null ? userAdj.hourlyRate : (user.hourlyRate || 0);
      
      const finalOvertimeHours = overtimeHours + manualOtHours;
      
      const shiftRate = 200000;
      const computedHourlyRate = shiftRate / 8;
      const baseSalary = validDays * shiftRate;
      const otSalary = finalOvertimeHours * computedHourlyRate * otMultiplier;
      const totalSalary = baseSalary + otSalary + bonus - penalty;
      
      return {
        userId: user.id,
        email: user.email,
        fullName: user.fullName || '',
        role: user.role,
        hourlyRate: finalHourlyRate,
        totalDays,
        validDays,
        errorDays,
        baseHours: Math.round(baseHours * 10) / 10,
        overtimeHours: Math.round(finalOvertimeHours * 10) / 10,
        baseSalary: Math.round(baseSalary),
        otSalary: Math.round(otSalary),
        bonus,
        penalty,
        salary: Math.round(totalSalary)
      };
    });
    
    res.json(payrollList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/payroll/adjust', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId, month, year, manualOtHours, bonus, penalty, hourlyRate } = req.body;
    if (!userId || !month || !year) {
      return res.status(400).json({ error: "Missing userId, month, or year" });
    }
    
    // Check if adjustment exists
    const [existing] = await pool.execute(
      'SELECT id FROM payroll_adjustments WHERE userId = ? AND month = ? AND year = ?',
      [userId, month, year]
    );
    
    if (existing.length > 0) {
      await pool.execute(
        'UPDATE payroll_adjustments SET manualOtHours = ?, bonus = ?, penalty = ?, hourlyRate = ? WHERE userId = ? AND month = ? AND year = ?',
        [manualOtHours || 0, bonus || 0, penalty || 0, hourlyRate !== undefined ? hourlyRate : null, userId, month, year]
      );
    } else {
      await pool.execute(
        'INSERT INTO payroll_adjustments (userId, month, year, manualOtHours, bonus, penalty, hourlyRate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, month, year, manualOtHours || 0, bonus || 0, penalty || 0, hourlyRate !== undefined ? hourlyRate : null]
      );
    }
    
    res.json({ message: "Đã lưu điều chỉnh thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/timesheet/:month/:year', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { month, year } = req.params;
    
    // Get all users except admin
    const [users] = await pool.execute('SELECT id, email, fullName, role FROM users WHERE role != "admin"');
    
    // Get all attendance records for the month
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDateObj = new Date(year, month, 0);
    const endDate = `${year}-${month.padStart(2, '0')}-${endDateObj.getDate().toString().padStart(2, '0')}`;
    
    const [attendance] = await pool.execute(
      'SELECT userId, date, totalHours, isValidShift FROM attendance WHERE date >= ? AND date <= ? AND checkOutTimeMillis IS NOT NULL',
      [startDate, endDate]
    );

    const timesheetList = users.map(user => {
      const userRecords = attendance.filter(a => a.userId === user.id);
      const days = {};
      
      let totalDays = 0;
      let totalHours = 0;

      userRecords.forEach(record => {
         const d = typeof record.date === 'string' ? record.date.substring(0, 10) : record.date.toISOString().split('T')[0];
         if (!days[d]) {
            days[d] = { totalHours: 0, isValid: true };
         }
         days[d].totalHours += parseFloat(record.totalHours || 0);
         if (!record.isValidShift) days[d].isValid = false;
      });

      Object.values(days).forEach(day => {
        totalDays += 1;
        totalHours += day.totalHours;
      });

      return {
        userId: user.id,
        email: user.email,
        fullName: user.fullName || '',
        days,
        totalDays,
        totalHours: Math.round(totalHours * 10) / 10
      };
    });
    
    res.json(timesheetList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/attendance', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { startStr, endStr } = req.query;
    
    let queryStr = 'SELECT a.* FROM attendance a JOIN users u ON a.userId = u.id WHERE u.role != "admin"';
    let params = [];
    
    if (startStr && endStr) {
      queryStr += ' AND a.date >= ? AND a.date <= ?';
      params.push(startStr, endStr);
    }
    
    queryStr += ' ORDER BY a.date DESC';
    
    const [rows] = await pool.execute(queryStr, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET records for specific user in specific month/year
app.get('/api/admin/attendance/:userId/:month/:year', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId, month, year } = req.params;
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const [rows] = await pool.execute(
      'SELECT * FROM attendance WHERE userId = ? AND date >= ? AND date <= ? ORDER BY date ASC',
      [userId, startStr, endStr]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE, UPDATE, or DELETE attendance record by admin
app.post('/api/admin/attendance/update', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id, userId, date, action, checkInTime, checkOutTime, shift_id } = req.body;
    
    if (action === 'delete') {
      if (id) {
        await pool.execute('DELETE FROM attendance WHERE id = ?', [id]);
      } else {
        await pool.execute('DELETE FROM attendance WHERE userId = ? AND date = ?', [userId, date]);
      }
      return res.json({ message: "Đã xoá bản ghi chấm công" });
    }
    
    if (action === 'update' || action === 'create') {
      let checkInTimeStr = checkInTime || '08:00:00';
      let checkOutTimeStr = checkOutTime || '17:00:00';
      
      let checkInDate = new Date(`${date}T${checkInTimeStr}`);
      let checkOutDate = new Date(`${date}T${checkOutTimeStr}`);
      
      if (checkOutDate < checkInDate) {
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      }
      
      const totalHours = (checkOutDate - checkInDate) / 3600000;
      
      // Determine user's shift if not provided
      let finalShiftId = shift_id;
      if (!finalShiftId) {
         const [userRows] = await pool.execute('SELECT shift_id, fullName, email FROM users WHERE id = ?', [userId]);
         finalShiftId = userRows[0]?.shift_id || 'shift_1';
      }

      // Calculate shift stats
      const [settingsRows] = await pool.execute('SELECT setting_value FROM settings WHERE setting_key = "general"');
      const settings = settingsRows.length > 0 ? JSON.parse(settingsRows[0].setting_value) : {};
      const currentShift = settings.shifts?.find(s => s.id === finalShiftId) || settings.shifts?.[0];
      
      let overtime_hours = 0;
      let late_minutes = 0;
      let early_leave_minutes = 0;
      let status = 'PRESENT';

      if (currentShift) {
         const [sh, sm] = currentShift.startTime.split(':');
         const [eh, em] = currentShift.endTime.split(':');
         let shiftStartDate = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), Number(sh), Number(sm), 0);
         let shiftEndDate = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), Number(eh), Number(em), 0);
         if (shiftEndDate < shiftStartDate) shiftEndDate.setDate(shiftEndDate.getDate() + 1);
         
         const diffLate = checkInDate.getTime() - shiftStartDate.getTime();
         if (diffLate > 0) late_minutes = Math.floor(diffLate / 60000);
         
         const diffEarly = shiftEndDate.getTime() - checkOutDate.getTime();
         if (diffEarly > 0) early_leave_minutes = Math.floor(diffEarly / 60000);
         
         const diffOt = checkOutDate.getTime() - shiftEndDate.getTime();
         if (diffOt > 0) overtime_hours = diffOt / 3600000;
         
         if (early_leave_minutes > 0 && late_minutes > 0) status = 'LATE';
         else if (early_leave_minutes > 0) status = 'EARLY_LEAVE';
         else if (overtime_hours > 0) status = 'OT';
         else if (late_minutes > 0) status = 'LATE';
      }

      if (action === 'update' && id) {
        await pool.execute(
          'UPDATE attendance SET checkInTimeMillis = ?, checkOutTimeMillis = ?, totalHours = ?, overtime_hours = ?, late_minutes = ?, early_leave_minutes = ?, status = ?, shift_id = ?, isValidShift = 1 WHERE id = ?',
          [checkInDate.getTime(), checkOutDate.getTime(), totalHours.toFixed(2), overtime_hours.toFixed(2), late_minutes, early_leave_minutes, status, finalShiftId, id]
        );
      } else {
        const [userRows] = await pool.execute('SELECT fullName, email FROM users WHERE id = ?', [userId]);
        const userEmail = userRows[0]?.fullName || userRows[0]?.email || 'unknown@gmail.com';
        
        await pool.execute(
          'INSERT INTO attendance (userId, userName, date, checkInTimeMillis, checkOutTimeMillis, isValidShift, totalHours, overtime_hours, late_minutes, early_leave_minutes, status, shift_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, userEmail, date, checkInDate.getTime(), checkOutDate.getTime(), 1, totalHours.toFixed(2), overtime_hours.toFixed(2), late_minutes, early_leave_minutes, status, finalShiftId]
        );
      }
      return res.json({ message: "Đã cập nhật bản ghi chấm công" });
    }
    
    res.status(400).json({ error: "Action không hợp lệ" });
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



app.put('/api/requests/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, adminNote, userId } = req.body;
    const reqId = req.params.id;
    
    // Fetch request to check type
    const [reqRows] = await pool.execute('SELECT * FROM requests WHERE id = ?', [reqId]);
    if (reqRows.length === 0) return res.status(404).json({ error: "Không tìm thấy đơn" });
    const requestData = reqRows[0];

    await pool.execute(
      'UPDATE requests SET status = ?, adminNote = ? WHERE id = ?',
      [status, adminNote, reqId]
    );
    
    // Create notification
    await pool.execute(
      'INSERT INTO notifications (userId, title, message) VALUES (?, ?, ?)',
      [userId, `Đơn của bạn đã bị ${status === 'approved' ? 'duyệt' : 'từ chối'}`, `Phản hồi: ${adminNote || 'Không có'}`]
    );

    // If shift swap and approved
    if (status === 'approved' && requestData.type === 'Đổi ca' && requestData.targetUserId) {
      const swapDate = requestData.date;
      const userA = requestData.userId;
      const userB = requestData.targetUserId;
      
      // Get their default shifts
      const [uA] = await pool.execute('SELECT shift_id FROM users WHERE id = ?', [userA]);
      const [uB] = await pool.execute('SELECT shift_id FROM users WHERE id = ?', [userB]);
      
      const shiftA = uA[0]?.shift_id || 'shift_1';
      const shiftB = uB[0]?.shift_id || 'shift_1';
      
      // Swap shifts in daily_shifts
      await pool.execute(
        'INSERT INTO daily_shifts (userId, date, shift_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE shift_id = ?',
        [userA, swapDate, shiftB, shiftB]
      );
      await pool.execute(
        'INSERT INTO daily_shifts (userId, date, shift_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE shift_id = ?',
        [userB, swapDate, shiftA, shiftA]
      );
      
      // Notify user B
      await pool.execute(
        'INSERT INTO notifications (userId, title, message) VALUES (?, ?, ?)',
        [userB, `Bạn có lịch đổi ca`, `Đổi ca với ${requestData.userName} vào ngày ${swapDate}.`]
      );
    }
    
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
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
