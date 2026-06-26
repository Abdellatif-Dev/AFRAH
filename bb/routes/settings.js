const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  db.get('SELECT * FROM settings WHERE id = 1', (err, row) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(row || { phone: '', email: '', address: '', logo: '', instagram: '', facebook: '', twitter: '', tiktok: '', whatsapp_chat: '', map_url: '', footer_description: '', admin_whatsapp: '' });
  });
});

router.put('/', verifyToken, (req, res) => {
  const { phone, email, address, logo, instagram, facebook, twitter, tiktok, whatsapp_chat, map_url, footer_description, admin_whatsapp } = req.body;
  db.run(`UPDATE settings SET 
    phone=COALESCE(?,phone), email=COALESCE(?,email), address=COALESCE(?,address), 
    logo=COALESCE(?,logo), instagram=COALESCE(?,instagram), facebook=COALESCE(?,facebook), 
    twitter=COALESCE(?,twitter), tiktok=COALESCE(?,tiktok), 
    whatsapp_chat=COALESCE(?,whatsapp_chat), map_url=COALESCE(?,map_url),
    footer_description=COALESCE(?,footer_description), admin_whatsapp=COALESCE(?,admin_whatsapp) WHERE id=1`,
    [phone ?? null, email ?? null, address ?? null, logo ?? null,
     instagram ?? null, facebook ?? null, twitter ?? null, tiktok ?? null,
     whatsapp_chat ?? null, map_url ?? null, footer_description ?? null, admin_whatsapp ?? null],
    function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ message: 'Settings updated' });
    }
  );
});

module.exports = router;
