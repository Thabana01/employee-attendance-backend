const express = require('express');
const cors = require('cors');
const pool = require('./db'); // PostgreSQL pool

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// GET all attendance records
app.get('/api/attendance', async (req, res) => {
  const { date, search } = req.query;
  try {
    let query = 'SELECT * FROM attendance';
    const params = [];
    const conditions = [];

    if (date) {
      conditions.push(`date = $${params.length + 1}`);
      params.push(date);
    }

    if (search) {
      conditions.push(`(employee_name ILIKE $${params.length + 1} OR employee_id ILIKE $${params.length + 2})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC, id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// POST new attendance record
app.post('/api/attendance', async (req, res) => {
  const { employeeName, employeeID, date, status } = req.body;

  // Validation
  if (!employeeName || !employeeID || !date || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!['Present', 'Absent'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Present or Absent' });
  }

  try {
    const query = `INSERT INTO attendance (employee_name, employee_id, date, status)
                   VALUES ($1, $2, $3, $4) RETURNING id`;
    const result = await pool.query(query, [employeeName, employeeID, date, status]);
    res.status(201).json({ id: result.rows[0].id, message: 'Attendance recorded successfully' });
  } catch (err) {
    console.error('Error inserting attendance:', err);
    res.status(500).json({ error: 'Failed to save attendance record' });
  }
});

// DELETE attendance record
app.delete('/api/attendance/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM attendance WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.json({ message: 'Attendance record deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting attendance:', err);
    res.status(500).json({ error: 'Failed to delete attendance record' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
