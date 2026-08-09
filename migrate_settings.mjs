import pool from './backend/db.js';

async function migrateSettings() {
  try {
    const [rows] = await pool.execute('SELECT setting_value FROM settings WHERE setting_key = "general"');
    if (rows.length > 0) {
      let settings = rows[0].setting_value;
      if (typeof settings === 'string') {
        settings = JSON.parse(settings);
      }
      
      // Update structure
      const newSettings = {
        factoryLat: settings.factoryLat || 10.762622,
        factoryLng: settings.factoryLng || 106.660172,
        maxDistance: settings.maxDistance || 500,
        wifiIp: settings.wifiIp || '',
        shifts: [
          { id: "shift_1", name: "Ca Hành chính", startTime: settings.shift1Start || settings.shiftStart || "08:00", endTime: settings.shift1End || settings.shiftEnd || "17:00" },
          { id: "shift_2", name: "Ca Đêm", startTime: settings.shift2Start || "18:00", endTime: settings.shift2End || "06:00" }
        ]
      };
      
      await pool.execute('UPDATE settings SET setting_value = ? WHERE setting_key = "general"', [JSON.stringify(newSettings)]);
      console.log('Migrated settings successfully');
    }
  } catch(e) {
    console.error('Migration failed:', e);
  }
  process.exit(0);
}

migrateSettings();
