const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { category_id, search } = req.query;

  const conditions = [];
  const params = [];

  if (category_id) { conditions.push('p.category_id = ?'); params.push(category_id); }
  if (search) { conditions.push('(p.title LIKE ? OR p.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

  const whereClause = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';

  // If page is not requested, return flat array of all products (compatibility with public pages)
  if (!req.query.page) {
    const sql = `SELECT p.*, pc.title as category_title FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id${whereClause} ORDER BY p.created_at DESC`;
    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json(rows);
    });
    return;
  }

  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.per_page) || 8;
  const offset = (page - 1) * perPage;

  const countSql = `SELECT COUNT(*) as total FROM products p${whereClause}`;
  db.get(countSql, params, (errCount, countRow) => {
    if (errCount) return res.status(500).json({ message: 'Server error' });

    const total = countRow ? countRow.total : 0;
    const dataSql = `SELECT p.*, pc.title as category_title FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id${whereClause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    db.all(dataSql, [...params, perPage, offset], (err, rows) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ data: rows, total });
    });
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
