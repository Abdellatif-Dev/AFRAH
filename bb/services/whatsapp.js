const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

let client = null;
let qrCode = null;
let isReady = false;
let isInitialized = false;

// ✅ 7iyed l Chrome paths dial Windows
function findChrome() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    console.log('✅ Chrome found from PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
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
    protocolTimeout: 300000, // 5 min
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions'
    ]
  };

  // Ila l9ina Chrome, zid l executablePath
  if (chromePath) {
    puppeteerOptions.executablePath = chromePath;
  }

  const persistentDir = process.env.PERSISTENT_DIR || path.join(__dirname, '..');
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(persistentDir, 'whatsapp-data')
    }),
    puppeteer: puppeteerOptions
  });

  client.on('qr', (qr) => {
    qrCode = qr;
    isReady = false;
    console.log('📱 WhatsApp QR code generated. Scan with your phone.');
  });

  client.on('ready', async () => {
    console.log('✅ WhatsApp client is ready!');
    qrCode = null;

    await new Promise(resolve => setTimeout(resolve, 10000));

    isReady = true;

    console.log('✅ WhatsApp fully initialized.');
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

function formatJID(phone) {
  if (phone.endsWith('@c.us')) return phone;
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '212' + cleaned.slice(1);
  }
  return `${cleaned}@c.us`;
}

async function sendMessage(phone, message) {
  console.log(`🔍 [WA-sendMessage] Called. isReady=${isReady}, client=${!!client}, phone="${phone}"`);
  if (!isReady || !client) {
    console.log('❌ [WA-sendMessage] WhatsApp NOT READY. Cannot send message.');
    return false;
  }

  try {
    const fullNumber = formatJID(phone);
    console.log(`📲 [WA-sendMessage] Formatted JID: ${fullNumber}`);

    // Check if number is registered on WhatsApp
    try {
      const isRegistered = await client.isRegisteredUser(fullNumber);
      console.log(`📲 [WA-sendMessage] isRegisteredUser(${fullNumber}) = ${isRegistered}`);
      if (!isRegistered) {
        console.warn(`⚠️ [WA-sendMessage] Number ${fullNumber} is NOT registered on WhatsApp!`);
      }
    } catch (regErr) {
      console.warn(`⚠️ [WA-sendMessage] Could not check registration: ${regErr.message}`);
    }

    const result = await client.sendMessage(fullNumber, message);
    console.log(`✅ [WA-sendMessage] Message SENT to ${fullNumber}. Result ID: ${result?.id?._serialized || 'unknown'}`);
    return true;
  } catch (err) {
    console.error(`❌ [WA-sendMessage] FAILED to send to phone="${phone}":`, err.message);
    console.error(`❌ [WA-sendMessage] Full error:`, err);
    return false;
  }
}

async function sendMedia(phone, imagePath, caption) {
  console.log(`🔍 [WA-sendMedia] Called. isReady=${isReady}, client=${!!client}, phone="${phone}", imagePath="${imagePath}"`);

  if (!isReady || !client) {
    console.log("❌ WhatsApp NOT READY");
    return false;
  }

  try {
    const fullNumber = formatJID(phone);

    console.log("📍 State:", await client.getState());
    console.log("📍 Image exists:", fs.existsSync(imagePath));

    if (!fs.existsSync(imagePath)) {
      console.log("❌ Image not found");
      return false;
    }

    console.log("📍 Image size:", fs.statSync(imagePath).size);

    const media = MessageMedia.fromFilePath(imagePath);
    console.log("📍 Media created");

    console.log("📍 Sending...");
    const result = await client.sendMessage(fullNumber, media, { caption });

    console.log("📍 Result:", result);
    console.log("✅ Media SENT");

    return true;

  } catch (err) {
    console.error("❌ Error:", err);
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
    try { await client.destroy(); } catch (e) { }
  }
  isInitialized = false;
  isReady = false;
  qrCode = null;
  client = null;
  setTimeout(init, 1000);
}

module.exports = { init, sendMessage, sendMedia, getQr, getStatus, restart };