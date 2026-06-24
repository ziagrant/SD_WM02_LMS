const express = require('express');
const router = express.Router();
const db = require('../db');
const { isLoggedIn, isHR, isApproved } = require('../middleware/auth');

// ─── POST /api/leaves ─────────────────────────────────────────────────────────
// Called when an employee submits the leave form on employee-dashboard.html
// Employee must be approved before they can submit.

router.post('/', isLoggedIn, isApproved, async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  const userId = req.session.user.id;

  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'All leave fields are required.' });
  }

  // Validate dates
  const start = new Date(startDate);
  const end   = new Date(endDate);

  if (end < start) {
    return res.status(400).json({ error: 'End date cannot be before start date.' });
  }

  // Calculate number of days requested
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRequested = Math.ceil((end - start) / msPerDay) + 1;

  try {
    await db.promise().query(
      `INSERT INTO leaves (user_id, leave_type, start_date, end_date, reason, days_requested, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, leaveType, startDate, endDate, reason, daysRequested]
    );

    res.status(201).json({ message: 'Leave request submitted successfully.' });

  } catch (err) {
    console.error('Submit leave error:', err);
    res.status(500).json({ error: 'Could not submit leave request.' });
  }
});

// ─── GET /api/leaves/my ───────────────────────────────────────────────────────
// Returns the logged-in employee's own leave history.
// Populates the "Recent Leave Requests" table on employee-dashboard.html

router.get('/my', isLoggedIn, isApproved, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const [leaves] = await db.promise().query(
      `SELECT id, leave_type, start_date, end_date, days_requested, reason, status, created_at
       FROM leaves
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ leaves });

  } catch (err) {
    console.error('Get my leaves error:', err);
    res.status(500).json({ error: 'Could not fetch leave history.' });
  }
});

// ─── GET /api/leaves/my/stats ─────────────────────────────────────────────────
// Returns leave balance data for the stats cards on employee-dashboard.html

router.get('/my/stats', isLoggedIn, isApproved, async (req, res) => {
  const userId = req.session.user.id;

  try {
    // Total leave days used (approved leaves only)
    const [[{ usedDays }]] = await db.promise().query(
      `SELECT COALESCE(SUM(days_requested), 0) as usedDays
       FROM leaves
       WHERE user_id = ? AND status = 'approved'`,
      [userId]
    );

    const [[{ pending }]] = await db.promise().query(
      `SELECT COUNT(*) as pending FROM leaves WHERE user_id = ? AND status = 'pending'`,
      [userId]
    );

    const [[{ approved }]] = await db.promise().query(
      `SELECT COUNT(*) as approved FROM leaves WHERE user_id = ? AND status = 'approved'`,
      [userId]
    );

    const TOTAL_ANNUAL_DAYS = 20; // adjust as per company policy
    const remaining = Math.max(0, TOTAL_ANNUAL_DAYS - usedDays);

    res.json({
      total: TOTAL_ANNUAL_DAYS,
      used: usedDays,
      remaining,
      pending,
      approved
    });

  } catch (err) {
    console.error('Leave stats error:', err);
    res.status(500).json({ error: 'Could not fetch leave stats.' });
  }
});

// ─── GET /api/leaves ─────────────────────────────────────────────────────────
// Returns ALL leave requests — used by review-leaves.html (HR view)
// Optionally filter by status: ?status=pending
// HR only.

router.get('/', isLoggedIn, isHR, async (req, res) => {
  const { status } = req.query;

  try {
    let query = `
      SELECT l.id, l.leave_type, l.start_date, l.end_date, l.days_requested,
             l.reason, l.status, l.created_at,
             u.first_name, u.last_name, u.employee_number, u.department
      FROM leaves l
      JOIN users u ON l.user_id = u.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE l.status = ?';
      params.push(status);
    }

    query += ' ORDER BY l.created_at DESC';

    const [leaves] = await db.promise().query(query, params);
    res.json({ leaves });

  } catch (err) {
    console.error('Get all leaves error:', err);
    res.status(500).json({ error: 'Could not fetch leave requests.' });
  }
});

// ─── PATCH /api/leaves/:id ────────────────────────────────────────────────────
// HR approves or rejects a leave request from review-leaves.html
// Body: { status: 'approved' | 'rejected' }

router.patch('/:id', isLoggedIn, isHR, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }

  try {
    const [result] = await db.promise().query(
      'UPDATE leaves SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    res.json({ message: `Leave request ${status} successfully.` });

  } catch (err) {
    console.error('Update leave status error:', err);
    res.status(500).json({ error: 'Could not update leave request.' });
  }
});

module.exports = router;
