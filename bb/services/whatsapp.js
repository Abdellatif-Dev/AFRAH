const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

let client = null;
let qrCode = null;
let isReady = false;
let isInitialized = false;
let healthCheckInterval = null;

// ✅ 7iyed l Chrome paths dial Windows + Linux (Railway/Docker kayjbdo Linux, machi Windows!)
function findChrome() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    console.log('✅ Chrome found from PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const possiblePaths = [
    // Linux (Railway / Docker)
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    // Windows (dev local)
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

  console.log('❌ Chrome not found at known paths. Puppeteer will try its bundled Chromium if available.');
  return null;
}

// ✅ FIX: wrapper li kay-limiter l wa9t li kayms7ab feh wa7ed promise.
// Hada howa l mochkil li tchowf f logs dyalk: l command kayb9a "hanging" b la jamais
// resolve/reject mnin l browser ykon matt. B hadi, ghadi treject manuellement men b3d X ms.
function withTimeout(promise, ms, label = 'operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    )
  ]);
}

function init() {
  if (isInitialized) return;
  isInitialized = true;

  const chromePath = findChrome();

  const puppeteerOptions = {
    headless: true,
    protocolTimeout: 90000, // ✅ FIX: 60s -> 90s, bach initial sync li b9at slow ma tfeshelch b force
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-accelerated-2d-canvas',
      '--no-zygote',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-translate',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      // ✅ FIX: hadi l vrai cause dial "Runtime.callFunctionOn timed out" -> Chrome
      // kay-throttle l tab f background (7ta f headless), w l timers/polling dial
      // WhatsApp Web kaybdaw bti'in m3a l wa9t hta l page katb9a frozen.
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-ipc-flooding-protection',
    ]
  };

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

    // ✅ FIX: bdal sleep fixe dyal 10s, kan-poll getState() l ghaya ywsel 'CONNECTED'.
    // WhatsApp Web kaydowwez sync kbira (chats/contacts) mnin l session, w f environment
    // b CPU limité hadshi b9adr ykhod bzaf wa9t -> 10s ma kafyin walou f had l7ala.
    console.log('⏳ Warming up... waiting for WhatsApp page to become fully responsive...');
    const warmupStart = Date.now();
    const warmupMaxMs = 5 * 60 * 1000; // 5 d9ay9 max
    let warmedUp = false;
    while (Date.now() - warmupStart < warmupMaxMs) {
      try {
        const state = await withTimeout(client.getState(), 20000, 'warmup getState');
        console.log(`📍 [Warmup] getState() = ${state} (${Math.round((Date.now() - warmupStart) / 1000)}s elapsed)`);
        if (state === 'CONNECTED') {
          warmedUp = true;
          break;
        }
      } catch (err) {
        console.warn(`⚠️ [Warmup] getState() failed/timed out: ${err.message}. Retrying...`);
      }
      await new Promise(r => setTimeout(r, 3000));
    }

    if (!warmedUp) {
      console.warn(`⚠️ [Warmup] Timed out after ${warmupMaxMs / 1000}s — marking ready anyway, but page might still be unstable.`);
    } else {
      console.log(`✅ [Warmup] Page is responsive (took ${Math.round((Date.now() - warmupStart) / 1000)}s).`);
    }

    isReady = true;
    console.log('✅ WhatsApp fully initialized.');

    // ✅ FIX: hada howa l vrai mochkil dyalk -> mnin Chrome ykrach (OOM 3la Railway ghalban),
    // l 'client' object kayb9a f mémoire ready=true, walakin l browser process matt mn taht.
    // L event 'disconnected' dyal whatsapp-web.js machi dima kaytfir f had l7ala,
    // donc khassna nesta3mlo l listener direct dyal puppeteer browser.
    try {
      const pupBrowser = client.pupBrowser;
      if (pupBrowser) {
        pupBrowser.on('disconnected', () => {
          console.log('💥 Puppeteer browser disconnected/crashed unexpectedly! Restarting WhatsApp client...');
          isReady = false;
          restart();
        });
      }
    } catch (e) {
      console.warn('⚠️ Could not attach pupBrowser disconnected listener:', e.message);
    }

    // ✅ FIX: health-check khfif kol 2 d9ay9 bach n3rfo wakha l browser mazal 7ay
    if (healthCheckInterval) clearInterval(healthCheckInterval);
    healthCheckInterval = setInterval(async () => {
      if (!isReady || !client) return;
      try {
        await withTimeout(client.getState(), 15000, 'health-check getState');
      } catch (err) {
        console.error('💥 [Health-check] WhatsApp client looks stuck/dead:', err.message);
        isReady = false;
        restart();
      }
    }, 2 * 60 * 1000);
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

    try {
      const isRegistered = await withTimeout(client.isRegisteredUser(fullNumber), 20000, 'isRegisteredUser');
      console.log(`📲 [WA-sendMessage] isRegisteredUser(${fullNumber}) = ${isRegistered}`);
      if (!isRegistered) {
        console.warn(`⚠️ [WA-sendMessage] Number ${fullNumber} is NOT registered on WhatsApp!`);
      }
    } catch (regErr) {
      console.warn(`⚠️ [WA-sendMessage] Could not check registration: ${regErr.message}`);
    }

    const result = await withTimeout(client.sendMessage(fullNumber, message), 30000, 'sendMessage');
    console.log(`✅ [WA-sendMessage] Message SENT to ${fullNumber}. Result ID: ${result?.id?._serialized || 'unknown'}`);
    return true;
  } catch (err) {
    console.error(`❌ [WA-sendMessage] FAILED to send to phone="${phone}":`, err.message);
    // ✅ FIX: ila kan timeout, ghaleban l browser matt -> restart direct bach next try ykon nadi
    if (String(err.message).includes('timed out')) {
      console.error('💥 [WA-sendMessage] Timeout detected -> browser probably dead. Restarting client...');
      isReady = false;
      restart();
    }
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

    console.log("📍 State:", await withTimeout(client.getState(), 15000, 'getState'));
    console.log("📍 Image exists:", fs.existsSync(imagePath));

    if (!fs.existsSync(imagePath)) {
      console.log("❌ Image not found");
      return false;
    }

    console.log("📍 Image size:", fs.statSync(imagePath).size);

    const media = MessageMedia.fromFilePath(imagePath);
    console.log("📍 Media created");

    console.log("📍 Sending...");
    const result = await withTimeout(client.sendMessage(fullNumber, media, { caption }), 45000, 'sendMedia');

    console.log("📍 Result:", result?.id?._serialized || result);
    console.log("✅ Media SENT");

    return true;

  } catch (err) {
    console.error("❌ Error:", err.message);
    // ✅ FIX: same logic -> ila timeout, restart bach next try ykon b browser jdid
    if (String(err.message).includes('timed out')) {
      console.error('💥 [WA-sendMedia] Timeout detected -> browser probably dead. Restarting client...');
      isReady = false;
      restart();
    }
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
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
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