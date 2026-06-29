const sqlite3 = require('sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const persistentDir = process.env.PERSISTENT_DIR;
const dbName = 'database.sqlite';
const defaultDbPath = path.join(__dirname, '..', dbName);

if (persistentDir) {
  const targetDbPath = path.join(persistentDir, dbName);
  if (!fs.existsSync(targetDbPath) && fs.existsSync(defaultDbPath)) {
    try {
      if (!fs.existsSync(persistentDir)) {
        fs.mkdirSync(persistentDir, { recursive: true });
      }
      fs.copyFileSync(defaultDbPath, targetDbPath);
      console.log('✅ Copied default database to persistent storage');
    } catch (e) {
      console.error('Failed to copy default database:', e.message);
    }
  }
}

const dbPath = persistentDir ? path.join(persistentDir, dbName) : defaultDbPath;
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB connection error:', err.message);
  else console.log('Connected to SQLite database');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    image TEXT DEFAULT '',
    address TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  )`);

  db.run("ALTER TABLE events ADD COLUMN image TEXT DEFAULT ''", (err) => {
    if (err && !err.message.includes('duplicate column')) console.error(err.message);
  });

  db.run(`CREATE TABLE IF NOT EXISTS event_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('image','video')) NOT NULL,
    file_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS package_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER NOT NULL,
    item TEXT NOT NULL,
    type TEXT DEFAULT 'gratuite' CHECK(type IN ('gratuite','pay')),
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT DEFAULT '',
    event_date TEXT DEFAULT '',
    package_id INTEGER,
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    advance_price REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    custom_items TEXT DEFAULT '',
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    logo TEXT DEFAULT '',
    instagram TEXT DEFAULT '',
    facebook TEXT DEFAULT '',
    twitter TEXT DEFAULT '',
    tiktok TEXT DEFAULT '',
    whatsapp_chat TEXT DEFAULT '',
    map_url TEXT DEFAULT ''
  )`);

  db.run(`ALTER TABLE settings ADD COLUMN instagram TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes('duplicate column')) console.error(err.message);
  });
  db.run(`ALTER TABLE settings ADD COLUMN facebook TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes('duplicate column')) console.error(err.message);
  });
  db.run(`ALTER TABLE settings ADD COLUMN twitter TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes('duplicate column')) console.error(err.message);
  });
  db.run(`ALTER TABLE settings ADD COLUMN tiktok TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes('duplicate column')) console.error(err.message);
  });
  db.run(`ALTER TABLE settings ADD COLUMN whatsapp_chat TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes('duplicate column')) console.error(err.message);
  });
  db.run(`ALTER TABLE settings ADD COLUMN map_url TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes('duplicate column')) console.error(err.message);
  });
  db.run(`ALTER TABLE settings ADD COLUMN footer_description TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes('duplicate column')) console.error(err.message);
  });
  db.run(`ALTER TABLE settings ADD COLUMN admin_whatsapp TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes('duplicate column')) console.error(err.message);
  });

  db.run(`ALTER TABLE orders ADD COLUMN custom_items TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes('duplicate column')) console.error(err.message);
  });

  db.run(`ALTER TABLE orders ADD COLUMN advance_price REAL DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) console.error(err.message);
  });

  db.run(`INSERT OR IGNORE INTO settings (id, phone, email, address, logo, instagram, facebook, twitter, tiktok, whatsapp_chat, map_url, footer_description, admin_whatsapp) VALUES (1, '', '', '', '', '', '', '', '', '', '', '', '')`);

  db.run(`CREATE TABLE IF NOT EXISTS product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS product_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT DEFAULT '',
    product_id INTEGER,
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
  )`);

  // Migration: drop product_orders CHECK constraint if still present
  db.run(`ALTER TABLE product_orders RENAME TO product_orders_old`, (err) => {
    if (!err) {
      db.run(`CREATE TABLE product_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT DEFAULT '',
        product_id INTEGER,
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )`, () => {
        db.run(`INSERT INTO product_orders SELECT * FROM product_orders_old`, () => {
          db.run(`DROP TABLE product_orders_old`);
        });
      });
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS google_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    access_token TEXT DEFAULT '',
    refresh_token TEXT DEFAULT '',
    expiry_date INTEGER DEFAULT 0
  )`);

  db.run(`INSERT OR IGNORE INTO google_tokens (id, access_token, refresh_token, expiry_date) VALUES (1, '', '', 0)`);

  db.run(`CREATE TABLE IF NOT EXISTS hero_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image TEXT NOT NULL,              -- هادي هي تصويرة الـ PC
    image_mobile TEXT DEFAULT '',     -- هادي هي تصويرة الموبايل الجديدة
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 2. هاد السطر كيزيد العمود للناس اللي ديجا عندهم قاعدة البيانات قديمة بلا ما تضيع الداتا ديالهم
  db.run(`ALTER TABLE hero_slides ADD COLUMN image_mobile TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes('duplicate column name') && !err.message.includes('duplicate column')) {
      console.error('Error adding image_mobile to hero_slides:', err.message);
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const hash = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (name, email, password) VALUES (?, ?, ?)`, ['Admin', 'admin@afrah.com', hash]);
});

module.exports = db;
