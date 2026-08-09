import pool from './backend/db.js';
async function alter() {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN shift_id VARCHAR(50) DEFAULT "shift_1"');
    console.log('Added shift_id to users table');
  } catch(e) {
    console.log('Error or column already exists:', e.message);
  }
  process.exit(0);
}
alter();
