const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { isLoggedIn } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { firstName, lastName, employeeNumber, email, department, password, confirmPassword } = req.body;

  if (!firstName || !lastName || !employeeNumber || !email || !department || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  if (!strongPassword.test(password)) {
    return res.status(400).json({ error: 'Password must contain uppercase, lowercase letters, and a number.' });
  }

  try {
    const [existing] = await db.promise().query(
      'SELECT id FROM users WHERE email = ? OR employee_number = ?',
      [email, employeeNumber]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email or employee number already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.promise().query(
      `INSERT INTO users (first_name, last_name, employee_number, email, department, password, role, status)
       VALUES (?, ?, ?, ?, ?, ?, 'employee', 'pending')`,
      [firstName, lastName, employeeNumber, email, department, hashedPassword]
    );

    res.status(201).json({ message: 'Account created. Please wait for HR approval before logging in.' });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ error: `This account is not registered as ${role}.` });
    }

    if (user.role === 'employee' && user.status !== 'approved') {
      return res.status(403).json({ error: 'Your account is still pending HR approval.' });
    }

    req.session.user = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      department: user.department,
      employeeNumber: user.employee_number,
      status: user.status
    };

    res.json({ message: 'Login successful.', user: req.session.user });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Could not log out.' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

router.get('/me', isLoggedIn, (req, res) => {
  res.json({ user: req.session.user });
});

module.exports = router;