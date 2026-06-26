import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ShoppingCart, X } from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

function OrderModal({ product, onClose }) {
  const [form, setForm] = useState({ customer_name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.phone) { toast.error('Nom et téléphone requis'); return; }
    setSubmitting(true);
    try {
      await API.post('/product-orders', { ...form, product_id: product.id });
      toast.success('Envoyé ! Nous vous contacterons bientôt.');
      onClose();
    } catch { toast.error('Erreur'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 transition-colors"><X size={20} /></button>
        {product.image && (
          <img src={`/uploads/products/${product.image}`} alt="" className="h-36 w-full object-cover rounded-2xl mb-5" />
        )}
        <h2 className="text-xl font-display font-bold text-gray-900">{product.title}</h2>
        <p className="text-lg font-bold text-gold-600 mt-1">{Number(product.price).toLocaleString()} DH</p>
        {product.description && <p className="text-sm text-gray-400 mt-2">{product.description}</p>}
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
            placeholder="Votre nom" required
            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-600 transition-all" />
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="Téléphone" required
            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-600 transition-all" />
          <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
            placeholder="Adresse (optionnelle)"
            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-600 transition-all" />
          <button type="submit" disabled={submitting}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-medium py-3 rounded-full transition-all">
            {submitting ? 'Envoi...' : 'Confirmer la commande'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Shop() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(null);

  useEffect(() => {
    Promise.all([
      API.get('/product-categories'),
      API.get('/products')
    ]).then(([catRes, prRes]) => {
      setCategories(catRes.data);
      setProducts(prRes.data);
      setActiveCategory('');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory ? products.filter(p => p.category_id === activeCategory) : products;

  return (
    <div className="min-h-screen bg-white">
      {/* Scrollbar custom styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>

      {ordering && <OrderModal product={ordering} onClose={() => setOrdering(null)} />}

      {/* Hero section */}
      <div className="relative h-[40vh] sm:h-[50vh] bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(255,215,0,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl sm:text-6xl font-display font-bold text-white mb-3">Boutique</h1>
          <p className="text-white/70 text-sm sm:text-base max-w-md">Découvrez notre sélection de produits artisanaux</p>
        </div>
      </div>

      {/* Section principale - SANS max-w-6xl mx-auto bach ybdaw mn lissr */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-16">
        
        {/* Categories - f lisr */}
        <div className="flex flex-wrap gap-2 mb-12">
          <button onClick={() => setActiveCategory('')}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === ''
                ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            Tous
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {cat.title}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filtered.map(pr => (
              <div key={pr.id} onClick={() => setOrdering(pr)}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer">
                <div className="h-48 overflow-hidden">
                  {pr.image ? (
                    <img src={`/uploads/products/${pr.image}`} alt={pr.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex items-center justify-center">
                      <span className="text-4xl font-display text-white/10">{pr.title[0]}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-gray-900 text-sm">{pr.title}</h3>
                    <span className="text-sm font-bold text-gold-600">{Number(pr.price).toLocaleString()} DH</span>
                  </div>
                  {pr.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{pr.description}</p>}
                  <div className="mt-3 flex items-center justify-center w-full bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium py-2 rounded-full transition-all gap-2">
                    <ShoppingCart size={14} /> Commander
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-20">Aucun produit dans cette catégorie</p>
        )}
      </div>
    </div>
  );
}