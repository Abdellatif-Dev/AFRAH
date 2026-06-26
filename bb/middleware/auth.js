const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'afrah_jwt_secret_2026';

function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'No token provided' });

  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { verifyToken, JWT_SECRET };
