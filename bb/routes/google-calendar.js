const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { getAuthUrl, getTokensFromCode, addEventToCalendar } = require('../services/googleCalendar');

router.get('/auth', (req, res) => {
  res.redirect(getAuthUrl());
});

router.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokens = await getTokensFromCode(code);
    db.run(`UPDATE google_tokens SET access_token = ?, refresh_token = ?, expiry_date = ? WHERE id = 1`,
      [tokens.access_token || '', tokens.refresh_token || '', tokens.expiry_date || 0]);
    res.send('<h1>Connecté!</h1><p>Google Calendar est connecté. Vous pouvez fermer cette page.</p>');
  } catch (err) {
    res.status(500).send('Erreur de connexion: ' + err.message);
  }
});

router.get('/status', verifyToken, (req, res) => {
  db.get(`SELECT access_token, refresh_token, expiry_date FROM google_tokens WHERE id = 1`, (err, row) => {
    if (err || !row) return res.json({ connected: false });
    res.json({ connected: !!row.access_token });
  });
});

router.post('/disconnect', verifyToken, (req, res) => {
  db.run(`UPDATE google_tokens SET access_token = '', refresh_token = '', expiry_date = 0 WHERE id = 1`, (err) => {
    if (err) return res.status(500).json({ message: 'Erreur de déconnexion' });
    res.json({ message: 'Google Calendar déconnecté' });
  });
});

router.post('/event', verifyToken, async (req, res) => {
  const { title, description, start, end } = req.body;
  if (!title || !start) return res.status(400).json({ message: 'Title and start date required' });

  db.get(`SELECT access_token, refresh_token, expiry_date FROM google_tokens WHERE id = 1`, async (err, row) => {
    if (err || !row || !row.access_token) return res.status(400).json({ message: 'Calendar not connected' });

    try {
      await addEventToCalendar({
        access_token: row.access_token,
        refresh_token: row.refresh_token,
        expiry_date: row.expiry_date
      }, { title, description, start, end: end || start });
      res.json({ message: 'Event created' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to create event: ' + err.message });
    }
  });
});

module.exports = router;
