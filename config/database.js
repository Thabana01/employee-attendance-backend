const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'employee_attendance',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database and tables
async function initializeDatabase() {
  try {
    let connection;
    
    // If no database specified, create it first
    if (!process.env.DB_NAME) {
      connection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        port: dbConfig.port
      });

      await connection.execute(`CREATE DATABASE IF NOT EXISTS employee_attendance`);
      console.log('Database created or already exists');
      await connection.end();
    }

    // Create tables
    await createTables();
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

async function createTables() {
  try {
    const connection = await pool.getConnection();
    
    // Create attendance table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employeeName VARCHAR(255) NOT NULL,
        employeeID VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        status ENUM('Present', 'Absent') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_attendance (employeeID, date)
      )
    `);
    
    console.log('MySQL tables created successfully');
    connection.release();
  } catch (error) {
    console.error('Table creation failed:', error);
  }
}

// Call initialization
initializeDatabase();

module.exports = pool;