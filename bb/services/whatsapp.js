const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

let client = null;
let qrCode = null;
let isReady = false;
let isInitialized = false;

// ✅ 7iyed l Chrome paths dial Windows
function findChrome() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      console.log('✅ Chrome found at:', chromePath);
      return chromePath;
    }
  }

  // Ila ma l9ach, 3awed jareb b chromium
  const puppeteerCache = path.join(process.env.LOCALAPPDATA || '', '.cache', 'puppeteer');
  if (fs.existsSync(puppeteerCache)) {
    console.log('🔍 Searching in puppeteer cache:', puppeteerCache);
  }

  console.log('❌ Chrome not found. Please install Google Chrome.');
  return null;
}

function init() {
  if (isInitialized) return;
  isInitialized = true;

  const chromePath = findChrome();

  const puppeteerOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  // Ila l9ina Chrome, zid l executablePath
  if (chromePath) {
    puppeteerOptions.executablePath = chromePath;
  }

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(__dirname, '..', 'whatsapp-data')
    }),
    puppeteer: puppeteerOptions
  });

  client.on('qr', (qr) => {
    qrCode = qr;
    isReady = false;
    console.log('📱 WhatsApp QR code generated. Scan with your phone.');
  });

  client.on('ready', () => {
    isReady = true;
    qrCode = null;
    console.log('✅ WhatsApp client is ready!');
  });

  client.on('disconnected', () => {
    isReady = false;
    console.log('⚠️ WhatsApp client disconnected.');
  });

  client.on('auth_failure', () => {
    isReady = false;
    console.log('❌ WhatsApp authentication failed.');
  });

  client.initialize().catch(err => {
    console.error('WhatsApp initialization error:', err.message);
    isInitialized = false;
  });
}

async function sendMessage(phone, message) {
  if (!isReady || !client) {
    console.log('WhatsApp not ready. Cannot send message.');
    return false;
  }

  try {
    const formatted = phone.startsWith('0') ? '212' + phone.slice(1) : phone;
    const fullNumber = formatted.includes('@c.us') ? formatted : `${formatted}@c.us`;
    await client.sendMessage(fullNumber, message);
    console.log(`WhatsApp message sent to ${phone}`);
    return true;
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
    return false;
  }
}

async function sendMedia(phone, imagePath, caption) {
  if (!isReady || !client) {
    console.log('WhatsApp not ready. Cannot send media.');
    return false;
  }

  try {
    const media = MessageMedia.fromFilePath(imagePath);
    const formatted = phone.startsWith('0') ? '212' + phone.slice(1) : phone;
    const fullNumber = formatted.includes('@c.us') ? formatted : `${formatted}@c.us`;
    await client.sendMessage(fullNumber, media, { caption });
    console.log(`WhatsApp media sent to ${phone}`);
    return true;
  } catch (err) {
    console.error('WhatsApp send media error:', err.message);
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
  if (client) {
    try { await client.destroy(); } catch (e) {}
  }
  isInitialized = false;
  isReady = false;
  qrCode = null;
  client = null;
  setTimeout(init, 1000);
}

module.exports = { init, sendMessage, sendMedia, getQr, getStatus, restart };