const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const categoryId = req.query.category_id;
  const search = req.query.search;

  let conditions = [];
  const params = [];

  if (categoryId) {
    conditions.push('p.category_id = ?');
    params.push(categoryId);
  }

  if (search) {
    conditions.push('(p.title LIKE ? OR p.description LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s);
  }

  const where = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

  let query = `SELECT p.*, c.title as category_title FROM packages p LEFT JOIN categories c ON p.category_id = c.id${where} ORDER BY p.price ASC`;

  db.all(query, params, (err, packages) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (packages.length === 0) return res.json([]);

    const ids = packages.map(p => p.id);
    const placeholders = ids.map(() => '?').join(',');
    db.all(`SELECT * FROM package_items WHERE package_id IN (${placeholders})`, ids, (err, items) => {
      if (err) return res.status(500).json({ message: 'Server error' });

      const result = packages.map(pkg => ({
        ...pkg,
        items: items.filter(item => item.package_id === pkg.id).map(i => ({ item: i.item, type: i.type }))
      }));
      res.json(result);
    });
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM packages WHERE id = ?', [req.params.id], (err, pkg) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    db.all('SELECT item, type FROM package_items WHERE package_id = ?', [req.params.id], (err, items) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ ...pkg, items: items.map(i => ({ item: i.item, type: i.type })) });
    });
  });
});

router.post('/', verifyToken, (req, res) => {
  const { category_id, title, price, image, description, items } = req.body;
  if (!title || price === undefined) return res.status(400).json({ message: 'Title and price required' });

  db.run('INSERT INTO packages (category_id, title, price, image, description) VALUES (?, ?, ?, ?, ?)',
    [category_id || null, title, price, image || '', description || ''],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });

      const packageId = this.lastID;
      if (items && items.length > 0) {
        const stmt = db.prepare('INSERT INTO package_items (package_id, item, type) VALUES (?, ?, ?)');
        items.forEach(it => stmt.run(packageId, it.item || it, it.type || 'gratuite'));
        stmt.finalize();
      }
      res.status(201).json({ id: packageId, message: 'Package created' });
    }
  );
});

router.put('/:id', verifyToken, (req, res) => {
  const { category_id, title, price, image, description, items } = req.body;
  db.run('UPDATE packages SET category_id=COALESCE(?,category_id), title=COALESCE(?,title), price=COALESCE(?,price), image=COALESCE(?,image), description=COALESCE(?,description) WHERE id=?',
    [category_id, title, price, image, description, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (this.changes === 0) return res.status(404).json({ message: 'Package not found' });

      if (items) {
        db.run('DELETE FROM package_items WHERE package_id = ?', [req.params.id], () => {
          const stmt = db.prepare('INSERT INTO package_items (package_id, item, type) VALUES (?, ?, ?)');
          items.forEach(it => stmt.run(req.params.id, it.item || it, it.type || 'gratuite'));
          stmt.finalize();
        });
      }
      res.json({ message: 'Package updated' });
    }
  );
});

router.delete('/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM packages WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (this.changes === 0) return res.status(404).json({ message: 'Package not found' });
    res.json({ message: 'Package deleted' });
  });
});

module.exports = router;
