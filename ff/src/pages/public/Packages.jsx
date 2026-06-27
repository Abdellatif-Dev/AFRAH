import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import PackageCard from '../../components/PackageCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Packages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeCategory = searchParams.get('category') || '';

  // Custom Package Builder states
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customProducts, setCustomProducts] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProductCategory, setActiveProductCategory] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    event_date: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      API.get('/packages'),
      API.get('/categories')
    ]).then(([pkgRes, catRes]) => {
      let pkgs = pkgRes.data;
      if (activeCategory) pkgs = pkgs.filter(p => String(p.category_id) === activeCategory);
      setPackages(pkgs);
      setCategories(catRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [activeCategory]);

  // Load products and product categories when custom builder is enabled
  useEffect(() => {
    if (showCustomBuilder && customProducts.length === 0) {
      setCustomLoading(true);
      Promise.all([
        API.get('/products'),
        API.get('/product-categories')
      ]).then(([prodRes, catRes]) => {
        setCustomProducts(prodRes.data);
        setProductCategories(catRes.data);
      }).catch(() => {
        toast.error('Erreur lors du chargement des options de personnalisation');
      }).finally(() => setCustomLoading(false));
    }
  }, [showCustomBuilder, customProducts.length]);

  const handleCategoryClick = (id) => {
    if (activeCategory === String(id)) setSearchParams({});
    else setSearchParams({ category: id });
  };

  const handleToggleProduct = (product) => {
    setSelectedProducts(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCustomOrderSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.phone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!form.event_date) {
      toast.error('Veuillez sélectionner une date');
      return;
    }
    if (selectedProducts.length === 0) {
      toast.error('Veuillez sélectionner au moins un élément pour votre forfait');
      return;
    }

    setSubmitting(true);
    try {
      const itemsList = selectedProducts.map(p => `${p.title} (${Number(p.price).toLocaleString()} DH)`).join(', ');
      const customItemsString = `${itemsList}, TOTAL: ${Number(totalPrice).toLocaleString()} DH`;

      await API.post('/orders', {
        ...form,
        package_id: null,
        custom_items: customItemsString
      });

      toast.success('Votre demande de forfait personnalisé a été envoyée avec succès !');
      setForm({
        customer_name: '',
        phone: '',
        address: '',
        event_date: '',
        notes: ''
      });
      setSelectedProducts([]);
      setShowCustomBuilder(false);
    } catch {
      toast.error('Une erreur est survenue lors de la réservation.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  const filteredProducts = customProducts.filter(prod => {
    const matchesSearch = prod.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeProductCategory === '' || String(prod.category_id) === String(activeProductCategory);
    return matchesSearch && matchesCategory;
  });

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="min-h-screen bg-[#fafafa] py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-semibold text-gold-600 uppercase tracking-[0.2em]">Tarifs</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-3">
            {showCustomBuilder ? 'Personnaliser Mon Forfait' : 'Nos Forfaits'}
          </h1>
          <div className="w-10 h-0.5 bg-gold-400 mx-auto mt-4 rounded-full" />
          <p className="text-sm text-gray-400 mt-3">
            {showCustomBuilder 
              ? 'Composez votre forfait sur-mesure en sélectionnant vos services préférés' 
              : 'Choisissez le forfait qui correspond à vos besoins ou créez le vôtre'}
          </p>
        </div>

        {/* Action Button: Toggle predefined / custom builder */}
        <div className="flex justify-center mb-10">
          {!showCustomBuilder ? (
            <button
              onClick={() => setShowCustomBuilder(true)}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-600 hover:to-gold-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Personnaliser mon forfait (Choisir mon pack)
            </button>
          ) : (
            <button
              onClick={() => setShowCustomBuilder(false)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-all shadow-sm"
            >
              <svg className="w-4 h-4 text-gray-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour aux forfaits standards
            </button>
          )}
        </div>

        {/* Predefined Packages View */}
        {!showCustomBuilder && (
          <>
            {categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                <button onClick={() => setSearchParams({})}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!activeCategory ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                  Tous
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => handleCategoryClick(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === String(cat.id) ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                    {cat.title}
                  </button>
                ))}
              </div>
            )}

            {packages.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-300">Aucun forfait disponible pour le moment.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {packages.map(pkg => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Custom Package Builder View */}
        {showCustomBuilder && (
          <div className="mt-4">
            {customLoading ? (
              <LoadingSpinner size="lg" />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left Side: Options Selection Table */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Filters and Search */}
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Rechercher une option (ex: camera, robe...)"
                          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    {/* Product Categories selector */}
                    {productCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          onClick={() => setActiveProductCategory('')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeProductCategory === ''
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Toutes les catégories
                        </button>
                        {productCategories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setActiveProductCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              String(activeProductCategory) === String(cat.id)
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {cat.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Options Table */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="px-5 py-3.5 text-center w-14">Choix</th>
                            <th className="px-5 py-3.5">Option</th>
                            <th className="px-5 py-3.5">Catégorie</th>
                            <th className="px-5 py-3.5 text-right">Prix</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredProducts.map(prod => {
                            const isSelected = selectedProducts.some(p => p.id === prod.id);
                            return (
                              <tr
                                key={prod.id}
                                onClick={() => handleToggleProduct(prod)}
                                className={`hover:bg-amber-50/10 transition-colors cursor-pointer ${isSelected ? 'bg-amber-50/20' : ''}`}
                              >
                                <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleProduct(prod)}
                                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400 focus:ring-offset-0 cursor-pointer"
                                  />
                                </td>
                                <td className="px-5 py-4">
                                  <div className="font-semibold text-gray-800 text-sm">{prod.title}</div>
                                  {prod.description && <div className="text-xs text-gray-400 mt-1 line-clamp-1">{prod.description}</div>}
                                </td>
                                <td className="px-5 py-4">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">
                                    {prod.category_title || 'Option'}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right font-bold text-gray-900 text-sm">
                                  {Number(prod.price).toLocaleString()} DH
                                </td>
                              </tr>
                            );
                          })}
                          {filteredProducts.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-5 py-16 text-center text-gray-400 text-sm">
                                Aucune option disponible. Essayez de changer les filtres ou la recherche.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Side: Panier & Commander Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                  
                  {/* Cart Summary */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Votre Panier ({selectedProducts.length})
                    </h3>

                    {selectedProducts.length === 0 ? (
                      <div className="text-center py-10 px-4 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        Sélectionnez des options à gauche pour composer votre forfait personnalisé.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                          {selectedProducts.map(prod => (
                            <div key={prod.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-gray-800 truncate">{prod.title}</div>
                                <div className="text-[10px] text-gray-400 truncate">{prod.category_title || 'Option'}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-bold text-gray-900">{Number(prod.price).toLocaleString()} DH</span>
                                <button
                                  onClick={() => handleToggleProduct(prod)}
                                  className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                                  title="Retirer"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 font-bold text-gray-900 text-sm">
                          <span>Total estimé :</span>
                          <span className="text-gold-600 text-base">{Number(totalPrice).toLocaleString()} DH</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Form */}
                  {selectedProducts.length > 0 && (
                    <form onSubmit={handleCustomOrderSubmit} className="pt-4 border-t border-gray-50 space-y-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Informations de réservation</h4>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nom complet *</label>
                        <input
                          type="text"
                          name="customer_name"
                          value={form.customer_name}
                          onChange={handleFormChange}
                          placeholder="Votre nom complet"
                          required
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all placeholder:text-gray-300"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone *</label>
                        <input
                          type="text"
                          name="phone"
                          value={form.phone}
                          onChange={handleFormChange}
                          placeholder="+212 6 XX XX XX XX"
                          required
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all placeholder:text-gray-300"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Adresse</label>
                        <input
                          type="text"
                          name="address"
                          value={form.address}
                          onChange={handleFormChange}
                          placeholder="Adresse de l'événement"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all placeholder:text-gray-300"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Date de l'événement *</label>
                        <input
                          type="date"
                          name="event_date"
                          value={form.event_date}
                          onChange={handleFormChange}
                          min={todayStr}
                          required
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                        <textarea
                          name="notes"
                          value={form.notes}
                          onChange={handleFormChange}
                          rows={3}
                          placeholder="Demandes particulières (ex: thèmes, horaires...)"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all placeholder:text-gray-300 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow-md text-xs"
                      >
                        {submitting ? 'En cours...' : 'Confirmer la réservation du pack'}
                      </button>
                    </form>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
