const db = require('./config/db');

const productCategories = [
  { title: 'Déco artisanale', description: 'Objets de décoration faits main' },
  { title: 'Cadeaux personnalisés', description: 'Idées cadeaux uniques' },
  { title: 'Accessoires mariage', description: 'Accessoires pour votre jour J' },
  { title: 'Pâtisserie orientale', description: 'Douceurs traditionnelles' },
];

const products = [
  { title: 'Bougie parfumée vanille', price: 80, category_idx: 0, description: 'Bougie artisanale à la vanille de Madagascar' },
  { title: 'Cadre photo en bois gravé', price: 120, category_idx: 1, description: 'Cadre personnalisé avec prénoms et date' },
  { title: 'Éventail en dentelle', price: 45, category_idx: 2, description: 'Éventail blanc pour mariée' },
  { title: 'Boîte à gâteaux en carton doré', price: 35, category_idx: 3, description: 'Boîte élégante pour vos pâtisseries' },
  { title: 'Vase en céramique peinte', price: 150, category_idx: 0, description: 'Vase fait main avec motifs marocains' },
  { title: 'Porte-clés prénom', price: 25, category_idx: 1, description: 'Porte-clés en cuir personnalisé' },
  { title: 'Coussin de mariage', price: 90, category_idx: 2, description: 'Coussin de cérémonie satiné' },
  { title: 'Corne de gazelle (boîte 500g)', price: 110, category_idx: 3, description: 'Pâtisserie traditionnelle marocaine' },
  { title: 'Bougeoir en métal ciselé', price: 65, category_idx: 0, description: 'Bougeoir artisanal en laiton' },
  { title: 'Gravure sur verre personnalisée', price: 200, category_idx: 1, description: 'Verre gravé au prénom du destinataire' },
];

const run = () => {
  console.log('Insertion des catégories produits...');
  const catIds = productCategories.map(c => {
    const stmt = db.prepare('INSERT INTO product_categories (title, description) VALUES (?, ?)');
    const info = stmt.run(c.title, c.description);
    console.log(`  ✓ ${c.title} (id=${info.lastInsertRowid})`);
    return info.lastInsertRowid;
  });

  console.log('Insertion des produits...');
  products.forEach(p => {
    const stmt = db.prepare('INSERT INTO products (category_id, title, price, description) VALUES (?, ?, ?, ?)');
    const info = stmt.run(catIds[p.category_idx], p.title, p.price, p.description);
    console.log(`  ✓ ${p.title} — ${p.price} DH (id=${info.lastInsertRowid})`);
  });

  console.log('\n✅ Seed terminé : 4 catégories, 10 produits.');
};

run();
