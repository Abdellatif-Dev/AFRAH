const db = require('./db');
const bcrypt = require('bcryptjs');

function seed() {
  // Check if data already exists — if yes, skip seeding
  db.get('SELECT COUNT(*) as count FROM categories', [], (err, row) => {
    if (err) {
      console.error('❌ Seed check error:', err.message);
      return;
    }

    if (row && row.count > 0) {
      console.log('✅ Database already has data, skipping seed.');
      return;
    }

    console.log('🌱 Starting database seeding (first time)...');
    runSeed();
  });
}

function runSeed() {
  db.serialize(() => {
    // ========== CATEGORIES ==========
    const categories = [
      ['Mariage', 'mariage.jpg', 'Services complets pour votre mariage de rêve'],
      ['Fiançailles', 'fiancailles.jpg', 'Organisation de soirée de fiançailles'],
      ['Anniversaire', 'anniversaire.jpg', 'Célébrez votre anniversaire en grand'],
      ['Baby Shower', 'babyshower.jpg', 'Organisation de baby shower'],
      ['Soirée Entreprise', 'entreprise.jpg', 'Événements professionnels et team building'],
      ['Décorations', 'decorations.jpg', 'Décoration florale et thématique']
    ];

    categories.forEach(([title, image, description]) => {
      db.run(
        `INSERT INTO categories (title, image, description) VALUES (?, ?, ?)`,
        [title, image, description]
      );
    });

    // ========== EVENTS ==========
    const events = [
      [1, 'Salle des Fêtes Royal', 'salle1.jpg', 'Casablanca, Boulevard Mohamed VI', 'Grande salle de 500 places avec piscine'],
      [1, 'Jardin Exotique', 'jardin1.jpg', 'Marrakech, Route de l\'Ourika', 'Jardin luxuriant pour cérémonie en plein air'],
      [2, 'Riad Traditionnel', 'riad1.jpg', 'Fès, Médina', 'Riad authentique pour soirée intime'],
      [3, 'Terrasse Panoramique', 'terrasse1.jpg', 'Tanger, Cap Spartel', 'Vue imprenable sur le détroit'],
      [4, 'Espace Familial', 'famille1.jpg', 'Rabat, Agdal', 'Espace chaleureux pour baby shower'],
      [5, 'Centre de Conférences', 'conference1.jpg', 'Casablanca, Sidi Maarouf', 'Salle équipée pour séminaires'],
    ];

    events.forEach(([category_id, title, image, address, description]) => {
      db.run(
        `INSERT INTO events (category_id, title, image, address, description) VALUES (?, ?, ?, ?, ?)`,
        [category_id, title, image, address, description]
      );
    });

    // ========== PACKAGES ==========
    const packages = [
      [1, 'Pack Mariage Essentiel', 15000, 'pack1.jpg', 'Photographe, DJ, traiteur, salle de base'],
      [1, 'Pack Mariage Premium', 35000, 'pack2.jpg', 'Tout inclus + fleuriste + voiture + animation'],
      [1, 'Pack Mariage Luxe', 75000, 'pack3.jpg', 'Tout inclus + hôtel 5 étoiles + voyage de noces'],
      [2, 'Pack Fiançailles Standard', 8000, 'pack4.jpg', 'Salle, décorations, traiteur'],
      [3, 'Pack Anniversaire Fun', 5000, 'pack5.jpg', 'DJ, gâteau, animations pour enfants'],
      [4, 'Pack Baby Shower Doux', 4500, 'pack6.jpg', 'Déco rose/bleu, gâteau, petits cadeaux'],
    ];

    packages.forEach(([category_id, title, price, image, description]) => {
      db.run(
        `INSERT INTO packages (category_id, title, price, image, description) VALUES (?, ?, ?, ?, ?)`,
        [category_id, title, price, image, description]
      );
    });

    // ========== PACKAGE ITEMS ==========
    const packageItems = [
      [1, 'Photographe professionnel', 'gratuite'],
      [1, 'DJ + Sonorisation', 'gratuite'],
      [1, 'Traiteur 100 personnes', 'gratuite'],
      [1, 'Salle de base', 'gratuite'],
      [2, 'Tout du Pack Essentiel', 'gratuite'],
      [2, 'Fleuriste + Bouquet', 'gratuite'],
      [2, 'Voiture de luxe', 'pay'],
      [2, 'Animation + Feux d\'artifice', 'pay'],
      [3, 'Tout du Pack Premium', 'gratuite'],
      [3, 'Hôtel 5 étoiles nuit de noces', 'pay'],
      [3, 'Voyage de noces Maldives', 'pay'],
      [3, 'Cadeaux invités personnalisés', 'pay'],
      [4, 'Salle décorée', 'gratuite'],
      [4, 'Traiteur 50 personnes', 'gratuite'],
      [5, 'DJ + Jeux', 'gratuite'],
      [5, 'Gâteau personnalisé', 'gratuite'],
      [6, 'Décorations thématiques', 'gratuite'],
      [6, 'Gâteau baby shower', 'gratuite'],
    ];

    packageItems.forEach(([package_id, item, type]) => {
      db.run(
        `INSERT INTO package_items (package_id, item, type) VALUES (?, ?, ?)`,
        [package_id, item, type]
      );
    });

    // ========== PRODUCT CATEGORIES ==========
    const productCategories = [
      ['Robes de Mariée', 'robe.jpg', 'Collection de robes de mariée 2024'],
      ['Costumes', 'costume.jpg', 'Costumes élégants pour le marié'],
      ['Accessoires', 'accessoires.jpg', 'Bijoux, voiles, gants'],
      ['Décoration', 'deco.jpg', 'Bougies, lanternes, confettis'],
      ['Faire-part', 'fairepart.jpg', 'Cartes d\'invitation personnalisées'],
    ];

    productCategories.forEach(([title, image, description]) => {
      db.run(
        `INSERT INTO product_categories (title, image, description) VALUES (?, ?, ?)`,
        [title, image, description]
      );
    });

    // ========== PRODUCTS ==========
    const products = [
      [1, 'Robe Princesse', 8500, 'robe1.jpg', 'Robe blanche en satin avec traîne'],
      [1, 'Robe Sirène', 12000, 'robe2.jpg', 'Robe moulante en dentelle'],
      [2, 'Costume 3 pièces Noir', 3500, 'costume1.jpg', 'Costume classique avec gilet'],
      [2, 'Costume Bleu Marine', 4200, 'costume2.jpg', 'Costume moderne ajusté'],
      [3, 'Voile Long Cathedral', 1500, 'voile1.jpg', 'Voile de 3 mètres avec broderie'],
      [3, 'Bouquet de Roses', 800, 'bouquet1.jpg', 'Bouquet de 50 roses blanches'],
      [4, 'Lanternes LED x10', 600, 'lanterne1.jpg', 'Lanternes décoratives lumineuses'],
      [4, 'Confettis Or x100', 300, 'confetti1.jpg', 'Sachets de confettis dorés'],
      [5, 'Faire-part Doré x50', 1200, 'fairepart1.jpg', 'Cartes dorées avec enveloppe'],
      [5, 'Faire-part Minimaliste x50', 900, 'fairepart2.jpg', 'Design épuré et moderne'],
    ];

    products.forEach(([category_id, title, price, image, description]) => {
      db.run(
        `INSERT INTO products (category_id, title, price, image, description) VALUES (?, ?, ?, ?, ?)`,
        [category_id, title, price, image, description]
      );
    });

    // ========== SETTINGS (ALREADY IN DB.JS) ==========
    // Deja créé f db.js

    console.log('✅ Database seeded successfully!');
  });
}

/**
 * Reset: delete all data from all tables then re-seed
 */
function resetAndSeed() {
  return new Promise((resolve, reject) => {
    console.log('🗑️ Resetting database...');
    db.serialize(() => {
      // Delete data in reverse dependency order
      db.run('DELETE FROM package_items');
      db.run('DELETE FROM product_orders');
      db.run('DELETE FROM orders');
      db.run('DELETE FROM products');
      db.run('DELETE FROM product_categories');
      db.run('DELETE FROM packages');
      db.run('DELETE FROM events');
      db.run('DELETE FROM event_media');
      db.run('DELETE FROM categories');
      db.run('DELETE FROM hero_slides');
      db.run('DELETE FROM contacts');
      // Reset auto-increment
      db.run("DELETE FROM sqlite_sequence");

      console.log('✅ All tables cleared.');

      // Now re-seed
      runSeed();

      // Small delay to let seed finish
      setTimeout(() => resolve(), 500);
    });
  });
}

module.exports = { seed, resetAndSeed };