const mysql = require('mysql2');

// A pool reuses connections instead of opening a new one per request.
// This is more efficient and handles concurrent requests properly.
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,    // max open connections at once
  queueLimit: 0
});

// Test the connection on startup so you know immediately if .env is wrong
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL database');
    connection.release();
  }
});

module.exports = pool;
