const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = bcrypt.compareSync(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });
});

router.get('/me', (req, res) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    db.get('SELECT id, name, email FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user) return res.status(401).json({ message: 'User not found' });
      res.json(user);
    });
  } catch {
    res.status(403).json({ message: 'Invalid token' });
  }
});

module.exports = router;
