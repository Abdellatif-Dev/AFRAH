const express = require('express');
const { verifyToken } = require('../middleware/auth');
const qrcode = require('qrcode');
const whatsapp = require('../services/whatsapp');

const router = express.Router();

router.get('/status', verifyToken, (req, res) => {
  const status = whatsapp.getStatus();
  res.json(status);
});

router.get('/qr', verifyToken, async (req, res) => {
  const qr = whatsapp.getQr();
  if (!qr) {
    return res.json({ qr: null, message: 'No QR code. Client might be ready or still initializing.' });
  }

  try {
    const qrImage = await qrcode.toDataURL(qr);
    res.json({ qr: qrImage, message: 'Scan this QR code with WhatsApp to connect.' });
  } catch {
    res.status(500).json({ message: 'Failed to generate QR image' });
  }
});

router.post('/restart', verifyToken, (req, res) => {
  whatsapp.restart();
  res.json({ message: 'WhatsApp client restarting...' });
});

module.exports = router;