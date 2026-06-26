const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const categoryId = req.query.category_id;
  const search = req.query.search;

  let conditions = [];
  const params = [];
  const countParams = [];

  if (categoryId) {
    conditions.push('e.category_id = ?');
    params.push(categoryId);
    countParams.push(categoryId);
  }

  if (search) {
    conditions.push('(e.title LIKE ? OR e.address LIKE ? OR e.description LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s);
    countParams.push(s, s, s);
  }

  const where = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

  let query = `SELECT e.*, c.title as category_title FROM events e LEFT JOIN categories c ON e.category_id = c.id${where} ORDER BY e.created_at DESC LIMIT ? OFFSET ?`;
  let countQuery = `SELECT COUNT(*) as total FROM events e${where}`;

  db.all(query, [...params, limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    db.get(countQuery, countParams, (_, count) => {
      res.json({ events: rows, total: count ? count.total : 0, page, limit });
    });
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT e.*, c.title as category_title FROM events e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = ?', [req.params.id], (err, event) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    db.all('SELECT * FROM event_media WHERE event_id = ? ORDER BY created_at DESC', [req.params.id], (err, media) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ ...event, media });
    });
  });
});

router.post('/', verifyToken, (req, res) => {
  const { category_id, title, image, address, description } = req.body;
  if (!title || !category_id) return res.status(400).json({ message: 'Title and category are required' });

  db.run('INSERT INTO events (category_id, title, image, address, description) VALUES (?, ?, ?, ?, ?)',
    [category_id, title, image || '', address || '', description || ''],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.status(201).json({ id: this.lastID, message: 'Event created' });
    }
  );
});

router.put('/:id', verifyToken, (req, res) => {
  const { category_id, title, image, address, description } = req.body;
  db.run('UPDATE events SET category_id=COALESCE(?,category_id), title=COALESCE(?,title), image=COALESCE(?,image), address=COALESCE(?,address), description=COALESCE(?,description) WHERE id=?',
    [category_id, title, image, address, description, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (this.changes === 0) return res.status(404).json({ message: 'Event not found' });
      res.json({ message: 'Event updated' });
    }
  );
});

router.delete('/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM events WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (this.changes === 0) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  });
});

module.exports = router;
