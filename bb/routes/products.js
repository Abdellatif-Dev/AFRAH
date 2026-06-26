const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { category_id, search } = req.query;
  let sql = `SELECT p.*, pc.title as category_title FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id`;
  const params = [];
  const where = [];

  if (category_id) { where.push('p.category_id = ?'); params.push(category_id); }
  if (search) { where.push('(p.title LIKE ? OR p.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY p.created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT p.*, pc.title as category_title FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id WHERE p.id = ?',
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (!row) return res.status(404).json({ message: 'Not found' });
      res.json(row);
    }
  );
});

router.post('/', verifyToken, (req, res) => {
  const { category_id, title, price, image, description } = req.body;
  if (!title || !price) return res.status(400).json({ message: 'Title and price are required' });
  db.run('INSERT INTO products (category_id, title, price, image, description) VALUES (?, ?, ?, ?, ?)',
    [category_id, title, parseFloat(price), image || '', description || ''],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.status(201).json({ id: this.lastID, message: 'Product created' });
    }
  );
});

router.put('/:id', verifyToken, (req, res) => {
  const { category_id, title, price, image, description } = req.body;
  db.run(`UPDATE products SET 
    category_id=COALESCE(?,category_id), title=COALESCE(?,title),  
    price=COALESCE(?,price), image=COALESCE(?,image), description=COALESCE(?,description) WHERE id=?`,
    [category_id ?? null, title ?? null, price !== undefined ? parseFloat(price) : null, image ?? null, description ?? null, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (!this.changes) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Product updated' });
    }
  );
});

router.delete('/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!this.changes) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Product deleted' });
  });
});

module.exports = router;
