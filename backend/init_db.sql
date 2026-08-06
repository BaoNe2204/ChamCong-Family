CREATE DATABASE IF NOT EXISTS chamcong_family;
USE chamcong_family;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  fullName VARCHAR(255),
  phone VARCHAR(50),
  role ENUM('admin', 'employee') DEFAULT 'employee',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  userName VARCHAR(255),
  date DATE NOT NULL,
  checkInTimeMillis BIGINT,
  checkOutTimeMillis BIGINT,
  totalHours DECIMAL(5,2),
  isValidShift BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  userName VARCHAR(255),
  type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  adminNote TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value JSON NOT NULL
);

-- Insert default settings
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
('general', '{"factoryLat": 10.762622, "factoryLng": 106.660172, "maxDistance": 500, "shiftStart": "08:00", "shiftEnd": "17:00"}');
