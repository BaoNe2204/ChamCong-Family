const pool = require('./db');

async function migrate() {
  try {
    console.log("Starting migration...");
    const queries = [
      "ALTER TABLE attendance ADD COLUMN shift_id VARCHAR(50);",
      "ALTER TABLE attendance ADD COLUMN overtime_hours DECIMAL(5,2) DEFAULT 0;",
      "ALTER TABLE attendance ADD COLUMN late_minutes INT DEFAULT 0;",
      "ALTER TABLE attendance ADD COLUMN early_leave_minutes INT DEFAULT 0;",
      "ALTER TABLE attendance ADD COLUMN status ENUM('PRESENT', 'LATE', 'EARLY_LEAVE', 'ABSENT', 'OT', 'LEAVE', 'FORGOT_CHECKOUT') DEFAULT 'PRESENT';"
    ];
    
    for (const q of queries) {
      try {
        await pool.execute(q);
        console.log(`Executed: ${q}`);
      } catch(e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log(`Skipped (already exists): ${q}`);
        } else {
            console.error(`Error executing ${q}:`, e.message);
        }
      }
    }
    
    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
