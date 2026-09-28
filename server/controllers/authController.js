const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

function makeToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const exists = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
  if (exists.rows.length > 0) {
    return res.status(400).json({ message: 'This email is already registered' });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'student') RETURNING id, name, email, role",
    [name.trim(), cleanEmail, hash]
  );
  const user = result.rows[0];
  res.status(201).json({ token: makeToken(user), user: publicUser(user) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  const user = result.rows[0];
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) return res.status(401).json({ message: 'Wrong email or password' });

  res.json({ token: makeToken(user), user: publicUser(user) });
};
