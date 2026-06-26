import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Search, Filter, Package, ChevronLeft, ChevronRight, Trash2, Pencil, X, Image as ImageIcon } from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';

export default function ManagePackages() {
  const [packages, setPackages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category_id: '', title: '', price: '', image: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = async (searchTerm = search, catId = filterCategory, page = currentPage, perPage = itemsPerPage) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (catId) params.append('category_id', catId);
      params.append('page', String(page));
      params.append('per_page', String(perPage));

      const [pkgRes, catRes] = await Promise.all([
        API.get(`/packages?${params}`),
        API.get('/categories')
      ]);
      setPackages(pkgRes.data.data || pkgRes.data);
      setTotalItems(pkgRes.data.total || (pkgRes.data.data ? pkgRes.data.data.length : pkgRes.data.length));
      setCategories(catRes.data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setCurrentPage(1);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => fetchData(val, filterCategory, 1, itemsPerPage), 300));
  };

  const handleCategoryFilter = (e) => {
    const val = e.target.value;
    setFilterCategory(val);
    setCurrentPage(1);
    fetchData(search, val, 1, itemsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchData(search, filterCategory, page, itemsPerPage);
  };

  const handleItemsPerPageChange = (e) => {
    const val = parseInt(e.target.value);
    setItemsPerPage(val);
    setCurrentPage(1);
    fetchData(search, filterCategory, 1, val);
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditing(null);
    setForm({ category_id: '', title: '', price: '', image: '', description: '' });
    setImageFile(null);
    setItems([]);
    setShowForm(true);
  };

  const openEdit = (pkg) => {
    setEditing(pkg);
    setForm({ category_id: pkg.category_id || '', title: pkg.title, price: String(pkg.price), image: pkg.image, description: pkg.description || '' });
    setImageFile(null);
    setItems((pkg.items || []).map(i => ({ item: i.item, type: i.type })));
    setShowForm(true);
  };

  const addItem = () => setItems(prev => [...prev, { item: '', type: 'gratuite' }]);

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) { toast.error('Titre et prix requis'); return; }
    setUploading(true);
    try {
      let imageName = form.image;
      if (imageFile) {
        const fd = new FormData();
        fd.append('type', 'package');
        fd.append('file', imageFile);
        const upRes = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageName = upRes.data.fileName;
      }
      const payload = { ...form, price: parseFloat(form.price), image: imageName, items: items.filter(i => i.item.trim()) };
      if (editing) {
        await API.put(`/packages/${editing.id}`, payload);
        toast.success('Forfait modifié');
      } else {
        await API.post('/packages', payload);
        toast.success('Forfait créé');
      }
      setShowForm(false);
      setEditing(null);
      fetchData();
    } catch { toast.error('Erreur'); }
    finally { setUploading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { 
      await API.delete(`/packages/${deleteTarget}`); 
      toast.success('Supprimé'); 
      // Reset to page 1 if current page becomes empty
      const newTotal = totalItems - 1;
      const maxPage = Math.ceil(newTotal / itemsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
        fetchData(search, filterCategory, maxPage, itemsPerPage);
      } else {
        fetchData();
      }
      setDeleteTarget(null); 
    }
    catch { toast.error('Erreur'); }
    finally { setDeleting(false); }
  };

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl shadow-lg shadow-gold-400/20">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Forfaits</h1>
            <p className="text-sm text-gray-500">Gérez vos forfaits et packages</p>
          </div>
        </div>
        <button 
          onClick={openCreate} 
          className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-gray-900/20 hover:shadow-gray-900/30 hover:-translate-y-0.5"
        >
          <Plus size={18} /> Ajouter un forfait
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-gold-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            <p className="text-xs text-gray-500">Total forfaits</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Filter className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            <p className="text-xs text-gray-500">Catégories</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
            <Search className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{packages.length}</p>
            <p className="text-xs text-gray-500">Résultats actuels</p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-gray-900">{editing ? 'Modifier le forfait' : 'Nouveau forfait'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie</label>
                <select name="category_id" value={form.category_id} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all">
                  <option value="">Toutes les catégories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="Titre du forfait" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix (DH)</label>
                <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="0.00" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Image</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100 file:transition-all" />
                  </div>
                  {(form.image && !imageFile) && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                      <ImageIcon size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-500 truncate max-w-[120px]">{form.image}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description du forfait..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all resize-none" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Items du forfait</label>
                <div className="space-y-2">
                  {items.map((it, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input value={it.item} onChange={e => updateItem(i, 'item', e.target.value)}
                        placeholder="Nom de l'item"
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all" />
                      <select value={it.type} onChange={e => updateItem(i, 'type', e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all">
                        <option value="gratuite">Gratuit</option>
                        <option value="pay">Payant</option>
                      </select>
                      <button type="button" onClick={() => removeItem(i)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem}
                  className="mt-3 text-sm text-gold-600 hover:text-gold-700 font-medium transition-all flex items-center gap-1">
                  <Plus size={16} /> Ajouter un item
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={uploading} className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 disabled:from-gray-300 disabled:to-gray-300 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all flex-1 shadow-lg shadow-gray-900/10">
                  {uploading ? 'En cours...' : (editing ? 'Modifier' : 'Créer')}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium py-2.5 px-6 rounded-full transition-all flex-1">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Rechercher</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={search} 
                onChange={handleSearchChange}
                placeholder="Rechercher par titre, description..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Catégorie</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                value={filterCategory} 
                onChange={handleCategoryFilter}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all appearance-none"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
        {packages.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">Aucun forfait trouvé</p>
            <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres ou ajoutez un nouveau forfait</p>
          </div>
        ) : packages.map(pkg => (
          <div key={pkg.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
            {/* Image */}
            <div className="relative h-40 bg-gray-100 overflow-hidden">
              {pkg.image ? (
                <img src={`/uploads/packages/${pkg.image}`} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <Package className="w-12 h-12 text-gray-300" />
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(pkg)} className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-gold-600 hover:text-gold-700 hover:bg-white shadow-sm transition-all">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(pkg.id)} className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-red-500 hover:text-red-700 hover:bg-white shadow-sm transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="absolute bottom-3 left-3">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gold-700 shadow-sm">
                  {Number(pkg.price).toLocaleString()} DH
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display font-semibold text-gray-900 line-clamp-1">{pkg.title}</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-gold-400"></span>
                {pkg.category_title || 'Toutes catégories'}
              </p>
              {pkg.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{pkg.description}</p>
              )}
              {(pkg.items || []).length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-gold-50 text-gold-700 rounded-lg text-xs font-medium">
                    {pkg.items.length} item{pkg.items.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Items preview */}
              {(pkg.items || []).length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {pkg.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'gratuite' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                      <span className="line-clamp-1">{item.item}</span>
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${item.type === 'gratuite' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {item.type === 'gratuite' ? 'Gratuit' : 'Payant'}
                      </span>
                    </div>
                  ))}
                  {pkg.items.length > 3 && (
                    <p className="text-xs text-gray-400 pl-3.5">+{pkg.items.length - 3} autres...</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(pkg)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-gold-600 hover:text-gold-700 hover:bg-gold-50 rounded-xl font-medium transition-all">
                  <Pencil size={14} /> Modifier
                </button>
                <button onClick={() => setDeleteTarget(pkg.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl font-medium transition-all">
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {packages.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Info */}
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-gray-700">{startItem}</span> à <span className="font-semibold text-gray-700">{endItem}</span> sur <span className="font-semibold text-gray-700">{totalItems}</span> forfaits
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Par page:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={handleItemsPerPageChange}
                  className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>
            </div>

            {/* Page Controls */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft size={18} />
              </button>

              {getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`min-w-[36px] h-9 px-3 rounded-xl text-sm font-medium transition-all ${
                    currentPage === page 
                      ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg shadow-gray-900/20' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        open={!!deleteTarget} 
        title="Supprimer le forfait"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer ce forfait ?"
        onConfirm={handleDelete} 
        onCancel={() => setDeleteTarget(null)} 
        loading={deleting} 
      />
    </div>
  );
}