const jwt = require('jsonwebtoken');

// Checks the "Authorization: Bearer <token>" header and puts the user in req.user
function requireLogin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in first' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Session expired. Please log in again' });
  }
}

// Use after requireLogin to protect admin-only routes
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
