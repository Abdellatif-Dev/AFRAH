const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

let client = null;
let qrCode = null;
let isReady = false;
let isInitialized = false;
let healthCheckInterval = null;

const persistentDir = process.env.PERSISTENT_DIR || path.join(__dirname, '..');
const sessionDir = path.join(persistentDir, 'whatsapp-data', 'session');

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

// ✅ wrapper li kay-limiter l wa9t li kayms7ab feh wa7ed promise (bach ma tbqach "hanging" l blassa)
function withTimeout(promise, ms, label = 'operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    )
  ]);
}

// ✅ NEW FIX: hadi l vrai cause dial "Code: 21 / profile appears to be in use".
// Chrome kayskhli SingletonLock/Cookie/Socket f l profile dir bach ma ykonch 2 process
// kaykhdmou b nafs l profil. Ila l process l9dim matt b chakl sale (crash/OOM/kill),
// had les fichiers kayb9aw hia hia f l volume persistent, w Chrome jdid kayrfod ywalla.
function cleanupChromeLocks(dir) {
  const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
  for (const f of lockFiles) {
    const fp = path.join(dir, f);
    try {
      // ✅ FIX: SingletonLock howa symlink li target dyalo "hostname-pid" (machi fichier 7a9i9i).
      // fs.existsSync() katb3a l symlink w kat-rja3 false ila target ma kaynch -> kant kat-skip
      // l lock b sukout bla ma t7iydo! unlinkSync kay7iyed l link nafso, machi target dyalo.
      fs.unlinkSync(fp);
      console.log(`🧹 Removed stale Chrome lock file: ${fp}`);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.warn(`⚠️ Could not remove lock file ${fp}:`, e.code || e.message);
      }
      // ENOENT = ma kanch kayn, normal, walou ma3andou
    }
  }
}

function init() {
  if (isInitialized) return;
  isInitialized = true;

  // ✅ NEW FIX: nmsa7o l locks 9bel ma n7awlo nl-launchiw Chrome, chaque fois
  cleanupChromeLocks(sessionDir);

  const chromePath = findChrome();

  const puppeteerOptions = {
    headless: true,
    protocolTimeout: 90000, // bach initial sync li b9at slow ma tfeshelch b force
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // كتحمي من كراش الذاكرة المؤقتة
      '--disable-gpu',
      '--disable-extensions',
      '--disable-accelerated-2d-canvas',
      '--no-zygote',
      '--single-process', // 👈 ضرووووورية فـ Railway باش ينقص الرام (خاصها restart نظيف، شفتي تحت)
      '--js-flags=--max-old-space-size=256', // ✅ FIX: 7iydna les quotes l zaydin (machi --js-flags="...") li kanou kaytrejmou ka partie men literal string
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-translate',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      // ✅ Re-added: kay-mn3o Chrome mn ma-throttle l timers/polling dial WhatsApp Web f background
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-ipc-flooding-protection',
    ]
  };

  if (chromePath) {
    puppeteerOptions.executablePath = chromePath;
  }

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

    // ✅ Re-added: kan-poll getState() l ghaya ywsel 'CONNECTED' bdal sleep fixe dyal 10s
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

    // mnin Chrome ykrach (OOM/single-process crash ghalban), l 'client' object kayb9a f mémoire
    // ready=true, walakin l browser process matt mn taht. L event 'disconnected' dyal
    // whatsapp-web.js machi dima kaytfir f had l7ala, donc khassna l listener direct dyal puppeteer.
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

    // health-check khfif kol 2 d9ay9 bach n3rfo wakha l browser mazal 7ay
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

    // ✅ NEW FIX: ila l error houwa b sabab profile lock, nmsa7o w n3awdo n7awlo automatiquement
    const msg = String(err.message || '');
    if (msg.includes('profile appears to be in use') || msg.includes('SingletonLock') || msg.includes('Failed to launch')) {
      console.log('🧹 Detected Chrome profile-lock / launch issue. Cleaning locks and retrying in 3s...');
      cleanupChromeLocks(sessionDir);
      setTimeout(init, 3000);
    }
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

    // حيدنا client.getState() من هنا (كانت كتكرر بلوكاج فـ Railway) — health-check
    // فالأعلى كافي بحالها لمراقبة الـ browser.

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

    console.log("📍 Result:", result?.id?._serialized || "SENT");
    console.log("✅ Media SENT");

    return true;

  } catch (err) {
    console.error("❌ Error in sendMedia:", err.message);
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
    try {
      // ✅ NEW FIX: ila destroy() kaytsanna bla nihaya (l page matt/single-process crashed),
      // n3tiwha ghi 10s w b3dha nforce-kill l process bach ma ytsannach l ate3 server.
      await withTimeout(client.destroy(), 10000, 'client.destroy');
    } catch (e) {
      console.warn('⚠️ client.destroy() failed/timed out, force-killing browser process:', e.message);
      try {
        const proc = client?.pupBrowser?.process();
        if (proc) proc.kill('SIGKILL');
      } catch (killErr) {
        console.warn('⚠️ Could not force-kill browser process:', killErr.message);
      }
    }
  }

  isInitialized = false;
  isReady = false;
  qrCode = null;
  client = null;

  // ✅ NEW FIX: nmsa7o l locks 9bel ma n3awdo nbdaw, bach ma tbqach "profile in use"
  cleanupChromeLocks(sessionDir);

  setTimeout(init, 1000);
}

module.exports = { init, sendMessage, sendMedia, getQr, getStatus, restart };