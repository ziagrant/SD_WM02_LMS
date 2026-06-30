// ─── MIDDLEWARE: Authentication & Authorization ────────────────────────────────
// These three functions are used to protect routes.
// They run BEFORE the route handler and either allow the request through (next())
// or block it with an error response.

// ─── isLoggedIn ───────────────────────────────────────────────────────────────
// Checks if the user is logged in before allowing access to a protected route.
// First checks the session (normal login flow).
// If no session, falls back to checking the x-user-id header (for cases where
// the session cookie didn't persist, e.g. cross-origin requests).
function isLoggedIn(req, res, next) {
  // ✅ Primary check: session exists and has a user object
  if (req.session && req.session.user) {
    return next(); // User is logged in — allow the request through
  }

  // 🔁 Fallback: check if the frontend sent a user ID in the request header
  const userId = req.headers['x-user-id'];
  if (userId) {
    const db = require('../db');

    // Look up the user in the database using the ID from the header
    db.promise().query('SELECT * FROM users WHERE id = ?', [userId])
      .then(([rows]) => {
        if (rows.length) {
          // User found — rebuild the session user object from the DB row
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
          next(); // Allow the request through
        } else {
          // No user found with that ID
          res.status(401).json({ error: 'Not authenticated. Please log in.' });
        }
      })
      .catch(() => res.status(401).json({ error: 'Not authenticated. Please log in.' }));
    return;
  }

  // ❌ No session and no header — user is not authenticated
  res.status(401).json({ error: 'Not authenticated. Please log in.' });
}

// ─── isHR ─────────────────────────────────────────────────────────────────────
// Checks if the logged-in user has the 'hr' role.
// Used to protect HR-only routes like approving accounts and reviewing leaves.
// Same session-first, header-fallback pattern as isLoggedIn.
function isHR(req, res, next) {
  // ✅ Primary check: session exists and user role is 'hr'
  if (req.session && req.session.user && req.session.user.role === 'hr') {
    return next(); // User is HR — allow the request through
  }

  // 🔁 Fallback: check the x-user-id header and look up their role in the DB
  const userId = req.headers['x-user-id'];
  if (userId) {
    const db = require('../db');

    // Only fetch the role column — we don't need the full user object here
    db.promise().query('SELECT role FROM users WHERE id = ?', [userId])
      .then(([rows]) => {
        if (rows.length && rows[0].role === 'hr') {
          next(); // User is HR — allow through
        } else {
          // User exists but is not HR
          res.status(403).json({ error: 'Access denied. HR only.' });
        }
      })
      .catch(() => res.status(403).json({ error: 'Access denied. HR only.' }));
    return;
  }

  // ❌ No session and no header — access denied
  res.status(403).json({ error: 'Access denied. HR only.' });
}

// ─── isApproved ───────────────────────────────────────────────────────────────
// Checks if the logged-in employee's account has been approved by HR.
// Employees must be approved before they can submit leave requests.
// Same session-first, header-fallback pattern as the others.
function isApproved(req, res, next) {
  // ✅ Primary check: session exists and user status is 'approved'
  if (req.session && req.session.user && req.session.user.status === 'approved') {
    return next(); // Account is approved — allow the request through
  }

  // 🔁 Fallback: check the x-user-id header and look up their status in the DB
  const userId = req.headers['x-user-id'];
  if (userId) {
    const db = require('../db');

    // Only fetch the status column
    db.promise().query('SELECT status FROM users WHERE id = ?', [userId])
      .then(([rows]) => {
        if (rows.length && rows[0].status === 'approved') {
          next(); // Account is approved — allow through
        } else {
          // Account exists but is still pending or rejected
          res.status(403).json({ error: 'Your account is not approved yet.' });
        }
      })
      .catch(() => res.status(403).json({ error: 'Your account is not approved yet.' }));
    return;
  }

  // ❌ No session and no header — access denied
  res.status(403).json({ error: 'Your account is not approved yet.' });
}

// Export all three middleware functions so they can be used in route files
module.exports = { isLoggedIn, isHR, isApproved };