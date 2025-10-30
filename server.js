const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// GET all attendance records
app.get('/api/attendance', (req, res) => {
  const { date, search } = req.query;
  
  let query = 'SELECT * FROM Attendance';
  let params = [];
  
  // Add filters if provided
  if (date || search) {
    query += ' WHERE ';
    const conditions = [];
    
    if (date) {
      conditions.push('date = ?');
      params.push(date);
    }
    
    if (search) {
      conditions.push('(employeeName LIKE ? OR employeeID LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += conditions.join(' AND ');
  }
  
  query += ' ORDER BY date DESC, id DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching attendance:', err.message);
      res.status(500).json({ error: 'Failed to fetch attendance records' });
    } else {
      res.json(rows);
    }
  });
});

// POST new attendance record
app.post('/api/attendance', (req, res) => {
  const { employeeName, employeeID, date, status } = req.body;
  
  // Validation
  if (!employeeName || !employeeID || !date || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (!['Present', 'Absent'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Present or Absent' });
  }
  
  const query = `INSERT INTO Attendance (employeeName, employeeID, date, status) 
                 VALUES (?, ?, ?, ?)`;
  
  db.run(query, [employeeName, employeeID, date, status], function(err) {
    if (err) {
      console.error('Error inserting attendance:', err.message);
      res.status(500).json({ error: 'Failed to save attendance record' });
    } else {
      res.status(201).json({ 
        id: this.lastID,
        message: 'Attendance recorded successfully' 
      });
    }
  });
});

// DELETE attendance record
app.delete('/api/attendance/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM Attendance WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting attendance:', err.message);
      res.status(500).json({ error: 'Failed to delete attendance record' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.json({ message: 'Attendance record deleted successfully' });
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});