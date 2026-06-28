# Backend-Frontend Connection Guide

## Overview

Your Leave Management System (LMS) now has a complete connection between the frontend and backend APIs. This guide explains how to set everything up and run the system.

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** (v14 or higher) installed
- **MySQL** database running
- **Two separate ports** available: one for backend (4000) and one for frontend (5500)

---

## 1. Backend Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the backend folder with:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_database
PORT=4000
SESSION_SECRET=your_secure_secret_key
```

### Step 3: Database Setup

1. Create the MySQL database:

```sql
CREATE DATABASE lms_database;
USE lms_database;
```

2. Import the schema from `database.sql`:

```bash
mysql -u root -p lms_database < database.sql
```

### Step 4: Start the Backend Server

```bash
npm start
# Or for development with auto-reload:
npm run dev
```

You should see: `Server is happily running on port 4000`

---

## 2. Frontend Setup

The frontend has been updated to communicate with the backend API at `http://localhost:4000/api`.

### Option A: Using Live Server (Recommended for Development)

1. Open the `frontend` folder in VS Code
2. Install the "Live Server" extension (if not already installed)
3. Right-click on `index.html` → "Open with Live Server"
4. The frontend will run on `http://localhost:5500` (or similar)

### Option B: Using Python Server

```bash
cd frontend
python -m http.server 5500
```

---

## 3. API Endpoints Overview

### Authentication Endpoints

| Method | Endpoint             | Purpose                 |
| ------ | -------------------- | ----------------------- |
| POST   | `/api/auth/register` | Register a new employee |
| POST   | `/api/auth/login`    | Login (employee or HR)  |
| POST   | `/api/auth/logout`   | Logout                  |

### Employee Endpoints

| Method | Endpoint                        | Purpose                             |
| ------ | ------------------------------- | ----------------------------------- |
| GET    | `/api/employees`                | Get all employees (HR only)         |
| GET    | `/api/employees?status=pending` | Get pending accounts (HR only)      |
| PATCH  | `/api/employees/:id/status`     | Approve/reject an account (HR only) |

### Leave Endpoints

| Method | Endpoint          | Purpose                           |
| ------ | ----------------- | --------------------------------- |
| POST   | `/api/leaves`     | Submit a leave request (employee) |
| GET    | `/api/leaves/my`  | Get employee's leave history      |
| GET    | `/api/leaves`     | Get all leave requests (HR only)  |
| PATCH  | `/api/leaves/:id` | Approve/reject a leave (HR only)  |

---

## 4. What Changed in the Frontend

The following features have been updated to use the backend API:

### ✅ Signup Form (`signup.html`)

- **Before:** Saved data to localStorage only
- **After:** POSTs to `POST /api/auth/register`
- Data is now stored in the MySQL database

### ✅ Login Pages (`employee-login.html`, `hr-login.html`)

- **Before:** localStorage-based mock authentication
- **After:** POSTs to `POST /api/auth/login`
- Establishes server-side sessions with cookies

### ✅ Employee Dashboard (`employee-dashboard.html`)

- **Before:** Read from localStorage
- **After:** GETs leave history from `GET /api/leaves/my`
- Displays real leave balance and pending requests

### ✅ Leave Request Form (`employee-dashboard.html`)

- **Before:** Saved to localStorage
- **After:** POSTs to `POST /api/leaves`
- Leave requests are now stored in database

### ✅ Approve Accounts (`approve-accounts.html`)

- **Before:** localStorage-based management
- **After:** GETs pending accounts from `GET /api/employees?status=pending`
- PATCHes approval decisions to `PATCH /api/employees/:id/status`

### ✅ Review Leaves (`review-leaves.html`)

- **Before:** localStorage-based management
- **After:** GETs all leaves from `GET /api/leaves`
- PATCHes approval decisions to `PATCH /api/leaves/:id`

### ✅ Reports (`reports.html`)

- **Before:** Filtered localStorage data
- **After:** Fetches real data from `GET /api/leaves`
- Filters and displays backend data

### ✅ HR Dashboard (`hr-dashboard.html`)

- **Before:** Summarized localStorage counts
- **After:** Fetches live counts from backend
- Displays current system statistics

---

## 5. Testing the Connection

### 1. Test Signup/Registration

1. Navigate to the frontend signup page
2. Fill in the form and submit
3. You should see a success message
4. Check the database to confirm the user was created

### 2. Test Login

1. Navigate to login page (HR or Employee)
2. Log in with the credentials you just created
3. You should be redirected to the appropriate dashboard

### 3. Test Leave Request

1. Log in as an employee
2. Go to the employee dashboard
3. Fill in the leave form and submit
4. The request should appear in the HR's review page

### 4. Test Leave Approval

1. Log in as HR
2. Go to "Review Leaves"
3. Approve or reject any pending leave request
4. The status should update in the database

---

## 6. Important Configuration Notes

### CORS Settings

The backend is configured to accept requests from:

- `http://localhost:5500`
- `http://localhost:5501`
- `http://127.0.0.1:5500`
- `http://127.0.0.1:5501`

If you're running the frontend on a different port, update `backend/index.js`:

```javascript
app.use(
  cors({
    origin: ["http://localhost:YOUR_PORT"],
    credentials: true,
  }),
);
```

### Session Management

- Sessions are stored in MySQL using `express-mysql-session`
- Cookies are httpOnly and set to expire after 8 hours
- `sameSite: 'lax'` for CSRF protection

---

## 7. Troubleshooting

### "Network error. Please check your backend connection."

- ✅ Ensure the backend is running on `http://localhost:4000`
- ✅ Check the CORS configuration in `backend/index.js`
- ✅ Verify your frontend port is in the CORS whitelist

### "Your account is still pending HR approval."

- ✅ This is expected for new employees
- ✅ Log in as HR and approve the account in "Approve Accounts" page

### "Failed to fetch leaves"

- ✅ Ensure the database tables exist (run `database.sql`)
- ✅ Verify the backend is connected to the correct database
- ✅ Check that you're logged in before accessing protected routes

### Database Connection Issues

- ✅ Verify MySQL is running
- ✅ Check `.env` file has correct credentials
- ✅ Ensure the database exists and tables are created

---

## 8. Next Steps

1. **Test the entire workflow:**
   - Create a new employee account
   - HR approves the account
   - Employee logs in and submits a leave request
   - HR reviews and approves the leave request

2. **Customize:**
   - Modify API endpoints in `frontend/script.js` (const `API_BASE`)
   - Adjust leave balance in `backend/routes/leaves.js` (const `TOTAL_ANNUAL_DAYS`)
   - Add additional validation or features as needed

3. **Deploy:**
   - Use a proper hosting service (AWS, Heroku, DigitalOcean, etc.)
   - Update CORS settings for production URLs
   - Use environment variables for sensitive data
   - Set `secure: true` for cookies in production

---

## Quick Start Command Summary

### Terminal 1 - Backend

```bash
cd backend
npm install
# Create .env file with database credentials
npm start
```

### Terminal 2 - Frontend

```bash
cd frontend
# Using Live Server: Right-click index.html → Open with Live Server
# OR using Python:
python -m http.server 5500
```

Then open your browser to `http://localhost:5500`

---

**Your LMS is now fully connected! 🎉**
