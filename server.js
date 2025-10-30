const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// GET all attendance records
app.get('/api/attendance', async (req, res) => {
  try {
    const { date, search } = req.query; // Removed page & limit

    let query = `
      SELECT * 
      FROM attendance 
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }

    if (search) {
      query += ' AND (employeeName LIKE ? OR employeeID LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY date DESC, created_at DESC'; // Removed LIMIT/OFFSET

    const [rows] = await pool.execute(query, params);

    res.json({
      data: rows
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// POST new attendance record
app.post('/api/attendance', async (req, res) => {
  try {
    const { employeeName, employeeID, date, status } = req.body;

    // Validation
    if (!employeeName || !employeeID || !date || !status) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['Present', 'Absent'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Present or Absent' });
    }

    const query = `
      INSERT INTO attendance (employeeName, employeeID, date, status) 
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [employeeName, employeeID, date, status]);

    res.status(201).json({
      id: result.insertId,
      message: 'Attendance recorded successfully',
      record: { id: result.insertId, employeeName, employeeID, date, status }
    });
  } catch (error) {
    console.error('Error creating attendance:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Attendance already recorded for this employee on the selected date' 
      });
    }
    res.status(500).json({ error: 'Failed to save attendance record' });
  }
});

// DELETE attendance record
app.delete('/api/attendance/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM attendance WHERE id = ?';
    const [result] = await pool.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json({ 
      message: 'Attendance record deleted successfully',
      deletedId: parseInt(id)
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ error: 'Failed to delete attendance record' });
  }
});

// GET attendance statistics
app.get('/api/attendance/stats', async (req, res) => {
  try {
    const { date } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent
      FROM attendance
    `;
    const params = [];

    if (date) {
      query += ' WHERE date = ?';
      params.push(date);
    }

    const [rows] = await pool.execute(query, params);
    const stats = rows[0];

    res.json({
      total: stats.total,
      present: stats.present,
      absent: stats.absent,
      attendanceRate: stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ 
      status: 'OK', 
      message: 'Employee Attendance Tracker API is running',
      database: 'MySQL Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Employee Attendance Tracker API is ready`);
  console.log(`🗄️  Using MySQL database`);
});
