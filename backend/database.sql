
-- LMS DATABASE SETUP
-- Run this once in MySQL Workbench to create your database.


CREATE DATABASE IF NOT EXISTS lms_db;
USE lms_db;

-- ─── Users Table ─────────────────────────────────────────────────────────────
-- Stores both employees and HR managers.
-- role:   'employee' | 'hr'
-- status: 'pending' | 'approved' | 'rejected'  (only relevant for employees)

CREATE TABLE IF NOT EXISTS users (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  first_name       VARCHAR(100)  NOT NULL,
  last_name        VARCHAR(100)  NOT NULL,
  employee_number  VARCHAR(20)   UNIQUE NOT NULL,
  email            VARCHAR(150)  UNIQUE NOT NULL,
  department       VARCHAR(100)  NOT NULL,
  password         VARCHAR(255)  NOT NULL,       -- bcrypt hash, never plain text
  role             ENUM('employee', 'hr')         NOT NULL DEFAULT 'employee',
  status           ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ─── Leaves Table ─────────────────────────────────────────────────────────────
-- leave_type matches the options in the employee-dashboard.html form select.

CREATE TABLE IF NOT EXISTS leaves (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT           NOT NULL,
  leave_type       ENUM('Annual Leave', 'Sick Leave', 'Family Responsibility', 'Maternity Leave') NOT NULL,
  start_date       DATE          NOT NULL,
  end_date         DATE          NOT NULL,
  days_requested   INT           NOT NULL,
  reason           TEXT          NOT NULL,
  status           ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Session Table ─────────────────────────────────────────────────────────────
-- Auto-created by connect-mysql2 when the server first starts.
-- You do NOT need to create this manually.
-- It will look like: CREATE TABLE sessions (session_id, expires, data)

-- ─── Seed: Default HR Account ────────────────────────────────────────────────
-- This inserts one HR manager so you can log in from day one.
-- Password is:  Admin@123
-- CHANGE THIS after first login!
-- The hash below was generated with bcrypt salt rounds = 10.

INSERT INTO users (first_name, last_name, employee_number, email, department, password, role, status)
VALUES (
  'HR', 'Manager',
  'HR001',
  'hr@lms.com',
  'Human Resources',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPZQMEqLbOS', -- Admin@123
  'hr',
  'approved'
)
ON DUPLICATE KEY UPDATE id = id; -- safe to re-run: skips if already exists
