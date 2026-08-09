const pool = require('./backend/db');
async function test() {
  const [rows] = await pool.execute('SELECT setting_value FROM settings WHERE setting_key = "general"');
  console.log(typeof rows[0].setting_value, rows[0].setting_value);
  process.exit();
}
test();
