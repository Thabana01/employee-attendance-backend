const sqlite3 = require('sqlite3').verbose();

// Create and connect to SQLite database
const db = new sqlite3.Database('./attendance.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    
    // Create Attendance table
    db.run(`CREATE TABLE IF NOT EXISTS Attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeName TEXT NOT NULL,
      employeeID TEXT NOT NULL,
      date DATE NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Present', 'Absent')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Attendance table created or already exists.');
      }
    });
  }
});

module.exports = db;