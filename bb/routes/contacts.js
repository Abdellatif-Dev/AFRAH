const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', (req, res) => {
  const { name, phone, message } = req.body;
  if (!name || !phone || !message) {
    return res.status(400).json({ message: 'Name, phone, and message are required' });
  }

  db.run('INSERT INTO contacts (name, phone, message) VALUES (?, ?, ?)',
    [name, phone, message],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.status(201).json({ id: this.lastID, message: 'Message sent successfully' });
    }
  );
});

router.get('/', verifyToken, (req, res) => {
  db.all('SELECT * FROM contacts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

router.delete('/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM contacts WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (this.changes === 0) return res.status(404).json({ message: 'Contact not found' });
    res.json({ message: 'Contact deleted successfully' });
  });
});

module.exports = router;
