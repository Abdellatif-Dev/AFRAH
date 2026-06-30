const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const whatsapp = require('../services/whatsapp');

const router = express.Router();

// ⚠️ BDEL HADI B DOMAIN DIALK
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// ✅ Status dyal had system: pending | avance | canceled | termini
const VALID_STATUSES = ['pending', 'avance', 'canceled', 'termini'];

router.post('/', (req, res) => {
  console.log('📩 [Orders] Received package order request:', req.body);
  const { customer_name, phone, address, event_date, package_id, notes, custom_items } = req.body;
  if (!customer_name || !phone) {
    console.warn('⚠️ [Orders] Missing required fields:', { customer_name, phone });
    return res.status(400).json({ message: 'Name and phone are required' });
  }

  // ✅ Kol commande jdida kat-dkhol b status 'pending'
  db.run('INSERT INTO orders (customer_name, phone, address, event_date, package_id, notes, custom_items, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [customer_name, phone, address || '', event_date || '', package_id || null, notes || '', custom_items || '', 'pending'],
    function (err) {
      if (err) {
        console.error('❌ [Orders] Database insertion error:', err.message);
        return res.status(500).json({ message: 'Server error' });
      }

      const orderId = this.lastID;
      console.log('✅ [Orders] Order inserted into DB with ID:', orderId);

      // إرجاع الاستجابة فوراً للواجهة الأمامية
      res.status(201).json({ id: orderId, message: 'Order placed successfully' });

      // معالجة إرسال رسائل الواتساب في الخلفية
      db.get(`
        SELECT o.*, p.title as package_title, p.image as package_image
        FROM orders o
        LEFT JOIN packages p ON o.package_id = p.id
        WHERE o.id = ?
      `, [orderId], async (err, order) => {
        if (err || !order) {
          console.error('❌ [Orders] Error fetching order for WhatsApp:', err?.message);
          return;
        }

        const forfaitDisplay = order.package_title || (order.custom_items ? 'Forfait Personnalisé 🛠️' : 'Non spécifié');
        const customItemsDisplay = order.custom_items 
          ? `🛍️ Éléments :\n${order.custom_items.split(', ').map(item => `  • ${item}`).join('\n')}\n━━━━━━━━━━━━━━━━━━\n`
          : '';

        // 1️⃣ رسالة الزبون (خالية تماماً من أي روابط تأكيد أو إلغاء)
        const clientMsg = `✨ *AFRAH — MARIAGE & ÉVÉNEMENTS* ✨
━━━━━━━━━━━━━━━━━━
Bonjour *${order.customer_name}* 👋

Nous avons bien reçu votre demande de réservation. Merci infiniment pour votre confiance 🤍

🧾 *Récapitulatif*
━━━━━━━━━━━━━━━━━━
📦 Forfait : *${forfaitDisplay}*
${customItemsDisplay}📅 Date événement : *${order.event_date || 'À confirmer'}*


Merci de nous avoir choisis pour ce moment si spécial 💫

_Afrah - Mariage & Événements_`;

        // 2️⃣ رسالة الأدمن (تحتوي على روابط التحكم الخاصة بالأدمن فقط)
        const adminMsg = `🆕 *Nouvelle commande #${order.id}*

👤 *Client :* ${order.customer_name}
📞 *Téléphone :* ${order.phone}
📍 *Adresse :* ${order.address || 'Non renseignée'}
📅 *Date :* ${order.event_date || 'Non spécifiée'}
📦 *Forfait :* ${forfaitDisplay}
${order.custom_items ? `🛍️ Éléments :\n${order.custom_items.split(', ').map(item => `  • ${item}`).join('\n')}\n` : ''}📝 *Notes :* ${order.notes || 'Aucune'}
🕐 *Date commande :* ${order.created_at?.slice(0, 16) || ''}

👉 *Liens rapides (Avance) :*
✅ Accepter avance: ${BASE_URL}/api/orders/${order.id}/confirm
❌ Refuser: ${BASE_URL}/api/orders/${order.id}/cancel`;

        // ----------------- إرسال الرسالة للزبون أولاً -----------------
        const baseDir = process.env.PERSISTENT_DIR || path.join(__dirname, '..');
        const imagePath = order.package_image
          ? path.join(baseDir, 'uploads', 'packages', order.package_image)
          : null;

        let clientSent = false;
        if (imagePath && fs.existsSync(imagePath)) {
          clientSent = await whatsapp.sendMedia(order.phone, imagePath, clientMsg);
        } else {
          clientSent = await whatsapp.sendMessage(order.phone, clientMsg);
        }
        console.log(`📱 [Orders] Client WhatsApp send outcome: ${clientSent ? 'SUCCESS' : 'FAILED'}`);

        // ----------------- إرسال إشعار للأدمن دائماً وبشكل مستقل -----------------
        try {
          const settings = await new Promise((resolve, reject) => {
            db.get('SELECT whatsapp_chat FROM settings ORDER BY id ASC LIMIT 1', [], (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          });

          const adminNumber = settings?.whatsapp_chat?.trim();
          if (adminNumber) {
            await whatsapp.sendMessage(adminNumber, adminMsg);
            console.log('✅ [Orders] Admin notified successfully with control links');
          } else {
            console.warn('⚠️ [Orders] adminNumber is not configured in settings');
          }
        } catch (adminErr) {
          console.error('❌ [Orders] Error notifying Admin:', adminErr);
        }
      });
    }
  );
});

router.get('/', verifyToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search;
  const statusFilter = req.query.status;

  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(o.customer_name LIKE ? OR o.phone LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s);
  }

  if (statusFilter && statusFilter !== 'all') {
    conditions.push('o.status = ?');
    params.push(statusFilter);
  }

  const whereClause = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';

  db.all(`
    SELECT o.*, p.title as package_title
    FROM orders o 
    LEFT JOIN packages p ON o.package_id = p.id 
    ${whereClause}
    ORDER BY o.created_at DESC 
    LIMIT ? OFFSET ?
  `, [...params, limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    db.get(`SELECT COUNT(*) as total FROM orders o${whereClause}`, params, (_, count) => {
      res.json({ orders: rows, total: count ? count.total : 0, page, limit });
    });
  });
});

router.put('/:id', verifyToken, (req, res) => {
  const { status, advance_price } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  let sql = 'UPDATE orders SET status = ?';
  const params = [status];

  if (status === 'avance' && advance_price !== undefined) {
    sql += ', advance_price = ?';
    params.push(advance_price);
  }

  sql += ' WHERE id = ?';
  params.push(req.params.id);

  db.run(sql, params, function (err) {
    if (err) { 
      console.error('❌ [Orders PUT] SQL error:', err.message, 'SQL:', sql, 'Params:', params); 
      return res.status(500).json({ message: 'Server error' }); 
    }
    if (this.changes === 0) return res.status(404).json({ message: 'Order not found' });

    res.json({ message: 'Order updated successfully' });

    // ✅ Mli status ywlli 'avance' (avance t9oblat) -> dir event f Google Calendar
    if (status === 'avance') {
      db.get(`SELECT o.*, p.title as package_title FROM orders o LEFT JOIN packages p ON o.package_id = p.id WHERE o.id = ?`, [req.params.id], async (err, order) => {
        if (err || !order) return;

        db.get(`SELECT access_token, refresh_token, expiry_date FROM google_tokens WHERE id = 1`, async (err, tokens) => {
          if (err || !tokens || !tokens.access_token) return;

          try {
            const { addEventToCalendar } = require('../services/googleCalendar');
            
            // ✅ حماية برمجية لتفادي توقف السيرفر في حالة عدم كتابة التاريخ أو وجود خطأ به
            let startTime = new Date().toISOString();
            let endTime = new Date().toISOString();

            if (order.event_date && order.event_date.trim() !== '') {
              const parsedStart = new Date(order.event_date + 'T09:00:00');
              const parsedEnd = new Date(order.event_date + 'T18:00:00');
              
              if (!isNaN(parsedStart.getTime())) startTime = parsedStart.toISOString();
              if (!isNaN(parsedEnd.getTime())) endTime = parsedEnd.toISOString();
            }

            await addEventToCalendar(tokens, {
              title: `${order.customer_name} - ${order.package_title || 'Événement'}`,
              // ✅ إضافة العربون (advance_price) إلى وصف التقويم
              description: `Client: ${order.customer_name}\nTél: ${order.phone}\nAdresse: ${order.address || ''}\nAvance (العربون): ${order.advance_price || advance_price || 0} DH\nNotes: ${order.notes || ''}`,
              start: startTime,
              end: endTime,
            });
          } catch (e) {
            console.error('Calendar event creation failed:', e.message);
          }
        });
      });
    }

    // ✅ Rsayel WhatsApp 7sb status: avance | canceled | termini
    if (['avance', 'canceled', 'termini'].includes(status)) {
      db.get(`SELECT o.* FROM orders o WHERE o.id = ?`, [req.params.id], async (err, order) => {
        if (err || !order) return;

        if (status === 'avance') {
          const msg = `✅ *Avance confirmée — #${order.id}*

Bonjour *${order.customer_name}* 👋

Votre avance a été reçue et votre réservation est désormais *confirmée* 🎉

Notre équipe vous contactera bientôt pour les derniers détails. À très vite ✨

_Afrah - Mariage & Événements_`;
          await whatsapp.sendMessage(order.phone, msg);
        }

        if (status === 'termini') {
          const msg = `🎉 *Événement terminé — #${order.id}*

Bonjour *${order.customer_name}* 👋

Nous espérons que votre événement s'est déroulé à la perfection ! ✨

Merci de nous avoir choisis pour ce jour spécial. N'hésitez pas à nous recommander à vos proches 🤍

_Afrah - Mariage & Événements_`;
          await whatsapp.sendMessage(order.phone, msg);
        }

        if (status === 'canceled') {
          const msg = `❌ *Concernant votre réservation #${order.id}*

Bonjour *${order.customer_name}*,

Nous sommes désolés, votre réservation n'a pas pu être confirmée cette fois-ci.

N'hésitez pas à nous contacter pour plus d'informations ou pour découvrir d'autres options 🤍

_Afrah - Mariage & Événements_`;
          await whatsapp.sendMessage(order.phone, msg);
        }
      });
    }
  });
});

// ✅ ROUTES JDIAD — BACH Y9DER YACCEPTE WLA YREFUSE L'AVANCE B LINK (mn WhatsApp)
router.get('/:id/confirm', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).send('ID invalide');

  // ✅ Confirm = ywlli status 'avance' (avance t9oblat)
  db.run('UPDATE orders SET status = ? WHERE id = ?', ['avance', id], function (err) {
    if (err) return res.status(500).send('Erreur serveur');
    if (this.changes === 0) return res.status(404).send('Commande introuvable');

    db.get('SELECT * FROM orders WHERE id = ?', [id], async (err, order) => {
      if (order) {
        const msg = `✅ *Avance confirmée — #${order.id}*

Bonjour *${order.customer_name}* 👋

Votre avance a été reçue et votre réservation est *confirmée* avec succès ! 🎉

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
        <title>✅ Avance Confirmée — AfraH</title>
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
          <h1>Avance Confirmée !</h1>
          <div class="order-id">Commande #${id}</div>
          <p>L'avance de cette réservation a été confirmée avec succès.</p>
          <p>Notre équipe vous contactera très prochainement pour finaliser les détails.</p>
          <div class="footer">Afrah — Mariage & Événements 💫</div>
        </div>
      </body>
      </html>
    `);
  });
});

router.get('/:id/cancel', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).send('ID invalide');

  db.run('UPDATE orders SET status = ? WHERE id = ?', ['canceled', id], function (err) {
    if (err) return res.status(500).send('Erreur serveur');
    if (this.changes === 0) return res.status(404).send('Commande introuvable');

    db.get('SELECT * FROM orders WHERE id = ?', [id], async (err, order) => {
      if (order) {
        const msg = `❌ *Réservation annulée — #${order.id}*

Bonjour *${order.customer_name}*,

Votre réservation a été *annulée*.

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
        <title>❌ Réservation Annulée — AfraH</title>
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
          <h1>Réservation Annulée</h1>
          <div class="order-id">Commande #${id}</div>
          <p>Votre réservation a été annulée.</p>
          <p>N'hésitez pas à nous contacter pour découvrir d'autres options.</p>
          <div class="footer">Afrah — Mariage & Événements 💫</div>
        </div>
      </body>
      </html>
    `);
  });
});

router.delete('/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM orders WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (this.changes === 0) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  });
});

module.exports = router;