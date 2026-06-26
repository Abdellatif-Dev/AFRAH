const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Find Chrome for whatsapp-web.js (puppeteer@24 nested dep)
const chromeDir = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
try {
  const dirs = fs.readdirSync(chromeDir).sort().reverse();
  for (const d of dirs) {
    const candidate = path.join(chromeDir, d, 'chrome-win64', 'chrome.exe');
    if (fs.existsSync(candidate)) {
      process.env.PUPPETEER_EXECUTABLE_PATH = candidate;
      break;
    }
  }
} catch {}

const cors = require('cors');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const eventRoutes = require('./routes/events');
const packageRoutes = require('./routes/packages');
const orderRoutes = require('./routes/orders');
const contactRoutes = require('./routes/contacts');
const uploadRoutes = require('./routes/upload');
const slideRoutes = require('./routes/slides');
const settingsRoutes = require('./routes/settings');
const productCategoryRoutes = require('./routes/product-categories');
const productRoutes = require('./routes/products');
const productOrderRoutes = require('./routes/product-orders');
const whatsappRoutes = require('./routes/whatsapp');
const whatsapp = require('./services/whatsapp');
const { seed } = require('./config/seeder');

const app = express();
const PORT = process.env.PORT || 5000;
seed();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/slides', slideRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-orders', productOrderRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

whatsapp.init();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
