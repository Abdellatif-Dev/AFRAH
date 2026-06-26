const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  db.all('SELECT * FROM product_categories ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

router.post('/', verifyToken, (req, res) => {
  const { title, image, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  db.run('INSERT INTO product_categories (title, image, description) VALUES (?, ?, ?)',
    [title, image || '', description || ''],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.status(201).json({ id: this.lastID, message: 'Category created' });
    }
  );
});

router.put('/:id', verifyToken, (req, res) => {
  const { title, image, description } = req.body;
  db.run('UPDATE product_categories SET title=COALESCE(?,title), image=COALESCE(?,image), description=COALESCE(?,description) WHERE id=?',
    [title ?? null, image ?? null, description ?? null, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (!this.changes) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Category updated' });
    }
  );
});

router.delete('/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM product_categories WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!this.changes) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Category deleted' });
  });
});

module.exports = router;
