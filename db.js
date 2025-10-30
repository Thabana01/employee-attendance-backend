const { Pool } = require('pg');

// PostgreSQL connection configuration
const pool = new Pool({
  host: 'dpg-d3jqlgt6ubrc73d2cefg-a.oregon-postgres.render.com', // Render Hostname
  port: 5432,                                                   // default PostgreSQL port
  user: 'luct_reporting_db_b56i_user',                          // Render username
  password: '3XC2Rmq7PXtT5bZd2Pl8ECECKZrvFzxj',                // Render password
  database: 'luct_reporting_db_b56i',                           // Render database name
  ssl: {
    rejectUnauthorized: false
  }
});

// Function to create Attendance table if it doesn't exist
const createAttendanceTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR(255) NOT NULL,
        employee_id VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(10) NOT NULL CHECK (status IN ('Present', 'Absent')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
    console.log('Attendance table created or already exists.');
  } catch (err) {
    console.error('Error creating Attendance table:', err);
  }
};

// Run table creation on startup
createAttendanceTable();

module.exports = pool;
