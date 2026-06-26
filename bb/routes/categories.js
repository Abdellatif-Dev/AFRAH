const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifyToken, (req, res) => {
  const { title, image, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  db.run('INSERT INTO categories (title, image, description) VALUES (?, ?, ?)', [title, image || '', description || ''], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.status(201).json({ id: this.lastID, message: 'Category created' });
  });
});

router.get('/', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM categories WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!row) return res.status(404).json({ message: 'Category not found' });
    res.json(row);
  });
});

router.put('/:id', verifyToken, (req, res) => {
  const { title, image, description } = req.body;
  db.run('UPDATE categories SET title = ?, image = ?, description = ? WHERE id = ?',
    [title, image || '', description || '', req.params.id], function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (this.changes === 0) return res.status(404).json({ message: 'Category not found' });
      res.json({ message: 'Category updated' });
    });
});

router.delete('/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM categories WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (this.changes === 0) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  });
});

module.exports = router;
