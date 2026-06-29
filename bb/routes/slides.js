const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// 1. جلب جميع الـ slides
router.get('/', (req, res) => {
  db.all('SELECT * FROM hero_slides ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(rows);
  });
});

// 2. إضافة slide جديدة بـ تصويرة الـ PC والموبايل
router.post('/', verifyToken, (req, res) => {
  const { image, image_mobile } = req.body;
  
  if (!image || !image_mobile) {
    return res.status(400).json({ message: 'Both PC and Mobile images are required' });
  }

  db.run(
    'INSERT INTO hero_slides (image, image_mobile) VALUES (?, ?)',
    [image, image_mobile],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.status(201).json({ id: this.lastID, message: 'Slide created' });
    }
  );
});
// 4. تعديل slide موجودة
router.put('/:id', verifyToken, (req, res) => {
  const { image, image_mobile } = req.body;

  db.get('SELECT * FROM hero_slides WHERE id = ?', [req.params.id], (err, slide) => {
    if (err || !slide) return res.status(404).json({ message: 'Slide not found' });

    // يلا ما تبدلاتش التصويرة كنخليو القديمة
    const newImage = image || slide.image;
    const newImageMobile = image_mobile || slide.image_mobile;

    const baseDir = process.env.PERSISTENT_DIR || path.join(__dirname, '..');

    // مسح تصويرة الـ PC القديمة يلا ترفعت وحدة جديدة [1]
    if (image && slide.image && image !== slide.image) {
      fs.unlink(path.join(baseDir, 'uploads', 'slides', slide.image), () => {});
    }

    // مسح تصويرة الموبايل القديمة يلا ترفعت وحدة جديدة [1]
    if (image_mobile && slide.image_mobile && image_mobile !== slide.image_mobile) {
      fs.unlink(path.join(baseDir, 'uploads', 'slides', slide.image_mobile), () => {});
    }

    db.run(
      'UPDATE hero_slides SET image = ?, image_mobile = ? WHERE id = ?',
      [newImage, newImageMobile, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json({ message: 'Slide updated successfully' });
      }
    );
  });
});
// 3. حذف الـ slide وتصاورها بجوج مع احترام الـ PERSISTENT_DIR
router.delete('/:id', verifyToken, (req, res) => {
  db.get('SELECT * FROM hero_slides WHERE id = ?', [req.params.id], (err, slide) => {
    if (err || !slide) return res.status(404).json({ message: 'Slide not found' });

    // تحديد المجلد الرئيسي (الدائم أو المحلي)
    const baseDir = process.env.PERSISTENT_DIR || path.join(__dirname, '..');

    // مسار تصويرة الـ PC وحذفها
    if (slide.image) {
      const pcPath = path.join(baseDir, 'uploads', 'slides', slide.image);
      fs.unlink(pcPath, (err) => {
        if (err) console.log('PC image file deletion failed or not found:', err.message);
      });
    }

    // مسار تصويرة الموبايل وحذفها
    if (slide.image_mobile) {
      const mobilePath = path.join(baseDir, 'uploads', 'slides', slide.image_mobile);
      fs.unlink(mobilePath, (err) => {
        if (err) console.log('Mobile image file deletion failed or not found:', err.message);
      });
    }

    // حذف السجل من الداتا بايز
    db.run('DELETE FROM hero_slides WHERE id = ?', [req.params.id], function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ message: 'Slide deleted' });
    });
  });
});

module.exports = router;