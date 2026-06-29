const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// الـ Storage الافتراضي القديم للملفات العادية
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVideo = file.mimetype.startsWith('video/');
    const type = req.body.type || (isVideo ? 'video' : 'image');
    let folder = 'uploads/events';
    if (type === 'video') folder = 'uploads/videos';
    else if (type === 'package') folder = 'uploads/packages';
    else if (type === 'category') folder = 'uploads/categories';
    else if (type === 'slide') folder = 'uploads/slides';
    else if (type === 'logo') folder = 'uploads/settings';
    else if (type === 'product') folder = 'uploads/products';

    const baseDir = process.env.PERSISTENT_DIR || path.join(__dirname, '..');
    const dir = path.join(baseDir, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImages = /jpeg|jpg|png|gif|webp/;
  const allowedVideos = /mp4|mov|avi|webm/;
  const ext = path.extname(file.originalname).toLowerCase();
  const isImage = allowedImages.test(ext);
  const isVideo = allowedVideos.test(ext);
  if (isImage || isVideo) cb(null, true);
  else cb(new Error('Only image and video files are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

// ─── خاص بالـ Dual Slides Upload ─────────────────────────────────────────
const slideStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseDir = process.env.PERSISTENT_DIR || path.join(__dirname, '..');
    const dir = path.join(baseDir, 'uploads', 'slides');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});
const uploadSlides = multer({ storage: slideStorage, fileFilter });

// الـ Route الجديد للرفع المزدوج (غادي يولي مساره هو /api/upload/dual)
router.post('/dual', verifyToken, (req, res) => {
  uploadSlides.fields([
    { name: 'filePc', maxCount: 1 },
    { name: 'fileMobile', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err.message);
      return res.status(400).json({ message: err.message });
    }
    
    // هنا رجعناهم اختياريين باش يلا بغينا نعدلو غير وحدة فيهم
    const pcFile = req.files['filePc'] ? req.files['filePc'][0] : null;
    const mobileFile = req.files['fileMobile'] ? req.files['fileMobile'][0] : null;

    res.json({
      pcName: pcFile ? pcFile.filename : null,
      mobileName: mobileFile ? mobileFile.filename : null
    });
  });
});
// ──────────────────────────────────────────────────────────────────────────

// الـ Routes القديمة ديال الرفع العادي
router.post('/', verifyToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({
    message: 'File uploaded successfully',
    fileName: req.file.filename,
    path: `/uploads/${req.body.type === 'video' ? 'videos' : req.body.type === 'package' ? 'packages' : req.body.type === 'category' ? 'categories' : req.body.type === 'slide' ? 'slides' : req.body.type === 'logo' ? 'settings' : req.body.type === 'product' ? 'products' : 'events'}/${req.file.filename}`
  });
});

router.post('/event-media', verifyToken, (req, res) => {
  const { event_id, type, file_name } = req.body;
  if (!event_id || !type || !file_name) {
    return res.status(400).json({ message: 'event_id, type, and file_name required' });
  }
  const db = require('../config/db');
  db.run('INSERT INTO event_media (event_id, type, file_name) VALUES (?, ?, ?)',
    [event_id, type, file_name],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.status(201).json({ id: this.lastID, message: 'Media saved successfully' });
    }
  );
});

router.delete('/event-media/:id', verifyToken, (req, res) => {
  const db = require('../config/db');
  db.get('SELECT * FROM event_media WHERE id = ?', [req.params.id], (err, media) => {
    if (err || !media) return res.status(404).json({ message: 'Media not found' });

    const folder = media.type === 'video' ? 'videos' : 'events';
    const baseDir = process.env.PERSISTENT_DIR || path.join(__dirname, '..');
    const filePath = path.join(baseDir, 'uploads', folder, media.file_name);
    fs.unlink(filePath, () => {});

    db.run('DELETE FROM event_media WHERE id = ?', [req.params.id], function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ message: 'Media deleted successfully' });
    });
  });
});

router.delete('/file', verifyToken, (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ message: 'filePath required' });
  const baseDir = process.env.PERSISTENT_DIR || path.join(__dirname, '..');
  const cleanPath = filePath.replace(/^\/?uploads\//, 'uploads/');
  const fullPath = path.join(baseDir, cleanPath);
  fs.unlink(fullPath, (err) => {
    if (err) return res.status(404).json({ message: 'File not found' });
    res.json({ message: 'File deleted successfully' });
  });
});

module.exports = router;