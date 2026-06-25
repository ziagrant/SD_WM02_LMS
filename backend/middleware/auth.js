function isLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  const userId = req.headers['x-user-id'];
  if (userId) {
    const db = require('../db');
    db.promise().query('SELECT * FROM users WHERE id = ?', [userId])
      .then(([rows]) => {
        if (rows.length) {
          const u = rows[0];
          req.session.user = {
            id: u.id,
            firstName: u.first_name,
            lastName: u.last_name,
            email: u.email,
            role: u.role,
            department: u.department,
            employeeNumber: u.employee_number,
            status: u.status
          };
          next();
        } else {
          res.status(401).json({ error: 'Not authenticated. Please log in.' });
        }
      })
      .catch(() => res.status(401).json({ error: 'Not authenticated. Please log in.' }));
    return;
  }

  res.status(401).json({ error: 'Not authenticated. Please log in.' });
}

function isHR(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'hr') {
    return next();
  }
  // Fallback: check header directly from DB
  const userId = req.headers['x-user-id'];
  if (userId) {
    const db = require('../db');
    db.promise().query('SELECT role FROM users WHERE id = ?', [userId])
      .then(([rows]) => {
        if (rows.length && rows[0].role === 'hr') {
          next();
        } else {
          res.status(403).json({ error: 'Access denied. HR only.' });
        }
      })
      .catch(() => res.status(403).json({ error: 'Access denied. HR only.' }));
    return;
  }
  res.status(403).json({ error: 'Access denied. HR only.' });
}

function isApproved(req, res, next) {
  if (req.session && req.session.user && req.session.user.status === 'approved') {
    return next();
  }
  const userId = req.headers['x-user-id'];
  if (userId) {
    const db = require('../db');
    db.promise().query('SELECT status FROM users WHERE id = ?', [userId])
      .then(([rows]) => {
        if (rows.length && rows[0].status === 'approved') {
          next();
        } else {
          res.status(403).json({ error: 'Your account is not approved yet.' });
        }
      })
      .catch(() => res.status(403).json({ error: 'Your account is not approved yet.' }));
    return;
  }
  res.status(403).json({ error: 'Your account is not approved yet.' });
}

module.exports = { isLoggedIn, isHR, isApproved };