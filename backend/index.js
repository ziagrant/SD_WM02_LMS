require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const app = express();

const sessionStore = new MySQLStore({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.use(cors({ origin: ['http://localhost:5500', 'http://localhost:5501', 'http://127.0.0.1:5500', 'http://127.0.0.1:5501'], credentials: true }));app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8, sameSite: 'lax', secure: false }
}));

const db = require('./db');

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/leaves',    require('./routes/leaves'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server is happily running on port ${PORT}`));