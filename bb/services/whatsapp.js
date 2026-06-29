const { makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');
const pino = require('pino');

let socket = null;
let qrCode = null;
let isReady = false;
let isInitialized = false;
let pingInterval = null;

function init() {
  if (isInitialized) return;
  isInitialized = true;

  const persistentDir = process.env.PERSISTENT_DIR || path.join(__dirname, '..');
  const authDir = path.join(persistentDir, 'whatsapp-data');

  useMultiFileAuthState(authDir).then(({ state, saveCreds }) => {
    socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.whatsaio('Afrah'),
      logger: pino({ level: 'silent' }),
      syncFullHistory: false,
    });

    socket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrCode = qr;
        isReady = false;
        console.log('📱 WhatsApp QR code generated. Scan with your phone.');
      }

      if (connection === 'open') {
        console.log('✅ WhatsApp client is ready!');
        qrCode = null;

        setTimeout(() => {
          isReady = true;
          console.log('✅ WhatsApp fully initialized.');
        }, 10000);

        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(async () => {
          if (!socket || !isReady) { clearInterval(pingInterval); return; }
          try {
            await Promise.race([
              socket.sendPresenceUpdate('available'),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
            ]);
          } catch {
            console.log('⚠️ WhatsApp ping failed, restarting...');
            restart();
          }
        }, 30000);
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        isReady = false;
        console.log('⚠️ WhatsApp disconnected:', DisconnectReason[reason] || reason);
        if (pingInterval) clearInterval(pingInterval);
        restart();
      }
    });

    socket.ev.on('creds.update', saveCreds);
  });
}

function formatJID(phone) {
  if (phone.endsWith('@s.whatsapp.net')) return phone;
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '212' + cleaned.slice(1);
  }
  return `${cleaned}@s.whatsapp.net`;
}

function withTimeout(promise, ms = 30000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
  ]);
}

async function sendMessage(phone, message) {
  console.log(`🔍 [WA-sendMessage] Called. isReady=${isReady}, socket=${!!socket}, phone="${phone}"`);
  if (!isReady || !socket) {
    console.log('❌ [WA-sendMessage] WhatsApp NOT READY. Cannot send message.');
    return false;
  }

  try {
    const jid = formatJID(phone);
    console.log(`📲 [WA-sendMessage] Formatted JID: ${jid}`);
    await withTimeout(socket.sendMessage(jid, { text: message }), 60000);
    console.log(`✅ [WA-sendMessage] Message SENT to ${jid}`);
    return true;
  } catch (err) {
    console.error(`❌ [WA-sendMessage] FAILED to send to phone="${phone}":`, err.message);
    restart();
    return false;
  }
}

async function sendMedia(phone, imagePath, caption) {
  console.log(`🔍 [WA-sendMedia] Called. isReady=${isReady}, socket=${!!socket}, phone="${phone}", imagePath="${imagePath}"`);
  if (!isReady || !socket) {
    console.log('❌ [WA-sendMedia] WhatsApp NOT READY. Cannot send media.');
    return false;
  }

  try {
    const jid = formatJID(phone);
    console.log(`📲 [WA-sendMedia] Formatted JID: ${jid}`);
    const imageBuffer = fs.readFileSync(imagePath);
    await withTimeout(socket.sendMessage(jid, { image: imageBuffer, caption }), 60000);
    console.log(`✅ [WA-sendMedia] Media SENT to ${jid}`);
    return true;
  } catch (err) {
    console.error(`❌ [WA-sendMedia] FAILED to send to phone="${phone}":`, err.message);
    restart();
    return false;
  }
}

function getQr() {
  return qrCode;
}

function getStatus() {
  return { ready: isReady, hasQr: !!qrCode };
}

async function restart() {
  if (pingInterval) clearInterval(pingInterval);
  if (socket) {
    try { socket.end(undefined); } catch (e) { }
  }
  isInitialized = false;
  isReady = false;
  qrCode = null;
  socket = null;
  setTimeout(init, 1000);
}

async function disconnect() {
  if (pingInterval) clearInterval(pingInterval);
  if (socket) {
    try { socket.end(undefined); } catch (e) { }
  }
  isInitialized = false;
  isReady = false;
  qrCode = null;
  socket = null;
  const persistentDir = process.env.PERSISTENT_DIR || path.join(__dirname, '..');
  const sessionDir = path.join(persistentDir, 'whatsapp-data');
  if (fs.existsSync(sessionDir)) {
    try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (e) { }
  }
}

module.exports = { init, sendMessage, sendMedia, getQr, getStatus, restart, disconnect };
