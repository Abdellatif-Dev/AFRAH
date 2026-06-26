const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const whatsapp = require('../services/whatsapp');

const router = express.Router();

// ⚠️ BDEL HADI B DOMAIN DIALK
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// GET — Kol l orders (m3a search + pagination + status filter)
router.get('/', verifyToken, (req, res) => {
  const { search, status } = req.query;
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.per_page) || 8;
  const offset = (page - 1) * perPage;

  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(po.customer_name LIKE ? OR po.phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    conditions.push('po.status = ?');
    params.push(status);
  }

  const whereClause = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';

  const countSql = `SELECT COUNT(*) as total FROM product_orders po${whereClause}`;
  db.get(countSql, params, (errCount, countRow) => {
    if (errCount) return res.status(500).json({ message: 'Server error' });

    const total = countRow ? countRow.total : 0;
    const dataSql = `SELECT po.*, p.title as product_title, p.price as product_price FROM product_orders po LEFT JOIN products p ON po.product_id = p.id${whereClause} ORDER BY po.created_at DESC LIMIT ? OFFSET ?`;
    db.all(dataSql, [...params, perPage, offset], (err, rows) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ data: rows, total });
    });
  });
});

// POST — Créer order jdid m3a links f WhatsApp
router.post('/', (req, res) => {
  const { customer_name, phone, address, product_id, notes } = req.body;
  if (!customer_name || !phone) return res.status(400).json({ message: 'Customer name and phone are required' });
  if (!product_id) return res.status(400).json({ message: 'Product ID is required' });

  db.run('INSERT INTO product_orders (customer_name, phone, address, product_id, notes) VALUES (?, ?, ?, ?, ?)',
    [customer_name, phone, address || '', product_id, notes || ''],
    function (err) {
      if (err) {
        console.error('Error inserting product order:', err.message);
        return res.status(500).json({ message: 'Server error' });
      }

      const orderId = this.lastID;

      res.status(201).json({ id: orderId, message: 'Order created' });

      db.get('SELECT title, image, price FROM products WHERE id = ?', [product_id], (err3, product) => {
        if (err3 || !product) {
          console.error('Error fetching product details:', err3?.message);
          return;
        }
        const productTitle = product.title || 'Produit';
        const productImage = product.image || '';
        const productPrice = product.price || 0;

        db.get('SELECT admin_whatsapp, whatsapp_chat FROM settings WHERE id = 1', (err2, row) => {
          const adminPhone = (row && row.admin_whatsapp) || '';
          const settingsWhatsApp = (row && row.whatsapp_chat) || '';

          // ✅ LINKS JDIAD
          const confirmLink = `${BASE_URL}/api/product-orders/${orderId}/confirm`;
          const cancelLink = `${BASE_URL}/api/product-orders/${orderId}/cancel`;

          const customerMsg = `✨ *AFRAH — MARIAGE & ÉVÉNEMENTS* ✨
━━━━━━━━━━━━━━━━━━
Bonjour *${customer_name}* 👋

Nous avons bien reçu votre commande pour :

📦 *${productTitle}*
💰 *Prix :* ${productPrice} DH

━━━━━━━━━━━━━━━━━━
👉 *Veuillez choisir une option :*

✅ *Confirmer la commande :*
${confirmLink}

❌ *Annuler la commande :*
${cancelLink}

Merci de nous avoir choisis ! 🤍

_Afrah - Mariage & Événements_`;

          const adminMsg = `🛍️ *Nouvelle commande produit #${orderId}*

📦 *Produit :* ${productTitle}
💰 *Prix :* ${productPrice} DH
👤 *Client :* ${customer_name}
📞 *Téléphone :* ${phone}
📍 *Adresse :* ${address || 'Non renseignée'}
📝 *Notes :* ${notes || 'Aucune'}

👉 *Liens rapides :*
✅ Confirmer : ${confirmLink}
❌ Annuler : ${cancelLink}`;

          const baseDir = process.env.PERSISTENT_DIR || path.join(__dirname, '..');
          const imagePath = productImage ? path.join(baseDir, 'uploads', 'products', productImage) : null;
          const hasImage = productImage && fs.existsSync(imagePath);

          const sendTo = (number, msg, img) => {
            if (img) return whatsapp.sendMedia(number, img, msg);
            return whatsapp.sendMessage(number, msg);
          };

          sendTo(phone, customerMsg, hasImage ? imagePath : null).then(sent => {
            // ✅ Ila num dial client ma mchatch, sift l settings.whatsapp_chat
            if (!sent) {
              const fallbackNumber = settingsWhatsApp.trim();
              if (fallbackNumber) {
                sendTo(fallbackNumber, adminMsg, hasImage ? imagePath : null)
                  .then(() => console.log(`✅ Product Order #${orderId}: Fallback sent to settings.whatsapp_chat`))
                  .catch(err4 => console.error('Fallback send error:', err4));
              } else {
                console.error('⚠️ Product Order #' + orderId + ': No fallback number configured');
              }
            } else if (adminPhone) {
              // Ila client wsel, sift l admin gha notification
              sendTo(adminPhone, adminMsg, hasImage ? imagePath : null);
            }
          });
        });
      });
    }
  );
});

// PUT — Update status (admin panel)
router.put('/:id', verifyToken, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'canceled'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  db.run('UPDATE product_orders SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!this.changes) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Order updated' });

    // ✅ Sifet notification l client ila tbdel status
    if (status === 'confirmed' || status === 'canceled') {
      db.get('SELECT * FROM product_orders WHERE id = ?', [req.params.id], async (err, order) => {
        if (err || !order) return;

        if (status === 'confirmed') {
          const msg = `✅ *Commande confirmée — #${order.id}*

Bonjour *${order.customer_name}* 👋

Excellente nouvelle ! Votre commande est désormais *confirmée* 🎉

Notre équipe vous contactera bientôt pour les derniers détails. À très vite ✨

_Afrah - Mariage & Événements_`;
          await whatsapp.sendMessage(order.phone, msg);
        }

        if (status === 'canceled') {
          const msg = `❌ *Concernant votre commande #${order.id}*

Bonjour *${order.customer_name}*,

Nous sommes désolés, votre commande n'a pas pu être confirmée cette fois-ci.

N'hésitez pas à nous contacter pour plus d'informations 🤍

_Afrah - Mariage & Événements_`;
          await whatsapp.sendMessage(order.phone, msg);
        }
      });
    }
  });
});

// ✅ ROUTE JDIAD — Confirmer b link
router.get('/:id/confirm', (req, res) => {
  const id = parseInt(req.params.id, 10);

  db.run('UPDATE product_orders SET status = ? WHERE id = ?', ['confirmed', id], function (err) {
    if (err) return res.status(500).send('Erreur serveur');
    if (this.changes === 0) return res.status(404).send('Commande introuvable');

    db.get('SELECT * FROM product_orders WHERE id = ?', [id], async (err, order) => {
      if (order) {
        const msg = `✅ *Commande confirmée — #${order.id}*

Bonjour *${order.customer_name}* 👋

Votre commande a été *confirmée* avec succès ! 🎉

Notre équipe vous contactera bientôt pour les derniers détails. À très vite ✨

_Afrah - Mariage & Événements_`;
        await whatsapp.sendMessage(order.phone, msg);
      }
    });

    res.send(`
      <!DOCTYPE html>
      <html lang="fr" dir="ltr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>✅ Commande Confirmée — AfraH</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .card {
            background: white;
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideUp 0.6s ease;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .icon {
            width: 80px; height: 80px;
            background: #22c55e;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
          }
          h1 { color: #1f2937; font-size: 24px; margin-bottom: 12px; }
          p { color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 8px; }
          .order-id {
            background: #f3f4f6;
            padding: 8px 16px;
            border-radius: 12px;
            font-weight: 600;
            color: #4b5563;
            display: inline-block;
            margin: 12px 0;
          }
          .footer {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <h1>Commande Confirmée !</h1>
          <div class="order-id">Commande #${id}</div>
          <p>Votre commande a été confirmée avec succès.</p>
          <p>Notre équipe vous contactera très prochainement pour finaliser les détails.</p>
          <div class="footer">Afrah — Mariage & Événements 💫</div>
        </div>
      </body>
      </html>
    `);
  });
});

// ✅ ROUTE JDIAD — Annuler b link
router.get('/:id/cancel', (req, res) => {
  const id = parseInt(req.params.id, 10);

  db.run('UPDATE product_orders SET status = ? WHERE id = ?', ['canceled', id], function (err) {
    if (err) return res.status(500).send('Erreur serveur');
    if (this.changes === 0) return res.status(404).send('Commande introuvable');

    db.get('SELECT * FROM product_orders WHERE id = ?', [id], async (err, order) => {
      if (order) {
        const msg = `❌ *Commande annulée — #${order.id}*

Bonjour *${order.customer_name}*,

Votre commande a été *annulée*.

N'hésitez pas à nous contacter pour plus d'informations ou pour découvrir d'autres options 🤍

_Afrah - Mariage & Événements_`;
        await whatsapp.sendMessage(order.phone, msg);
      }
    });

    res.send(`
      <!DOCTYPE html>
      <html lang="fr" dir="ltr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>❌ Commande Annulée — AfraH</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, sans-serif;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .card {
            background: white;
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideUp 0.6s ease;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .icon {
            width: 80px; height: 80px;
            background: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
          }
          h1 { color: #1f2937; font-size: 24px; margin-bottom: 12px; }
          p { color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 8px; }
          .order-id {
            background: #f3f4f6;
            padding: 8px 16px;
            border-radius: 12px;
            font-weight: 600;
            color: #4b5563;
            display: inline-block;
            margin: 12px 0;
          }
          .footer {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">❌</div>
          <h1>Commande Annulée</h1>
          <div class="order-id">Commande #${id}</div>
          <p>Votre commande a été annulée.</p>
          <p>N'hésitez pas à nous contacter pour découvrir d'autres options.</p>
          <div class="footer">Afrah — Mariage & Événements 💫</div>
        </div>
      </body>
      </html>
    `);
  });
});

// DELETE — Supprimer order
router.delete('/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM product_orders WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!this.changes) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Order deleted' });
  });
});

module.exports = router;