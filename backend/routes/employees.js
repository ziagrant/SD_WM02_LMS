const express = require('express');
const router = express.Router();
const db = require('../db');
const { isLoggedIn, isHR } = require('../middleware/auth');

// Used by approve-accounts.html
// Returns all employees. Optionally filter by status: ?status=pending
// HR only.

router.get('/', isLoggedIn, isHR, async (req, res) => {
  const { status } = req.query;

  try {
    let query = `SELECT id, first_name, last_name, employee_number, email, department, status, created_at
                 FROM users WHERE role = 'employee'`;
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [employees] = await db.promise().query(query, params);
    res.json({ employees });

  } catch (err) {
    console.error('Get employees error:', err);
    res.status(500).json({ error: 'Could not fetch employees.' });
  }
});



router.patch('/:id/status', isLoggedIn, isHR, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }

  try {
    const [result] = await db.promise().query(
      'UPDATE users SET status = ? WHERE id = ? AND role = "employee"',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    res.json({ message: `Employee account ${status} successfully.` });

  } catch (err) {
    console.error('Update employee status error:', err);
    res.status(500).json({ error: 'Could not update employee status.' });
  }
});


router.get('/stats', isLoggedIn, isHR, async (req, res) => {
  try {
    const [[{ total }]] = await db.promise().query(
      `SELECT COUNT(*) as total FROM users WHERE role = 'employee'`
    );
    const [[{ pending }]] = await db.promise().query(
      `SELECT COUNT(*) as pending FROM users WHERE role = 'employee' AND status = 'pending'`
    );
    const [[{ approved }]] = await db.promise().query(
      `SELECT COUNT(*) as approved FROM users WHERE role = 'employee' AND status = 'approved'`
    );

    res.json({ total, pending, approved });

  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Could not fetch stats.' });
  }
});

module.exports = router;
