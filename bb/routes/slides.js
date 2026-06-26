const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.get('/', (req, res) => {
  db.all('SELECT * FROM hero_slides ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

router.post('/', verifyToken, (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ message: 'Image is required' });
  db.run('INSERT INTO hero_slides (image) VALUES (?)', [image], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.status(201).json({ id: this.lastID, message: 'Slide created' });
  });
});

router.delete('/:id', verifyToken, (req, res) => {
  db.get('SELECT * FROM hero_slides WHERE id = ?', [req.params.id], (err, slide) => {
    if (err || !slide) return res.status(404).json({ message: 'Slide not found' });
    const filePath = path.join(__dirname, '..', 'uploads', 'slides', slide.image);
    fs.unlink(filePath, () => {});
    db.run('DELETE FROM hero_slides WHERE id = ?', [req.params.id], function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ message: 'Slide deleted' });
    });
  });
});

module.exports = router;
