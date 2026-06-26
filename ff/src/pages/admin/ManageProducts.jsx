import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, Search, Filter, Package, Image as ImageIcon, X, ChevronLeft, ChevronRight, Tag, DollarSign, Grid3X3, List } from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import FormModal from '../../components/FormModal';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category_id: '', title: '', price: '', image: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = async (searchTerm = search, catId = filterCategory, page = currentPage, perPage = itemsPerPage) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (catId) params.append('category_id', catId);
      params.append('page', String(page));
      params.append('per_page', String(perPage));
      const [prRes, catRes] = await Promise.all([
        API.get(`/products?${params}`),
        API.get('/product-categories')
      ]);
      setProducts(prRes.data.data || prRes.data);
      setTotalItems(prRes.data.total || (prRes.data.data ? prRes.data.data.length : prRes.data.length));
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
    setForm({ category_id: categories[0]?.id || '', title: '', price: '', image: '', description: '' });
    setImageFile(null);
    setShowForm(true);
  };

  const openEdit = (pr) => {
    setEditing(pr);
    setForm({ category_id: pr.category_id || '', title: pr.title, price: String(pr.price), image: pr.image || '', description: pr.description || '' });
    setImageFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) { toast.error('Titre et prix requis'); return; }
    setUploading(true);
    try {
      let imageName = form.image;
      if (imageFile) {
        const fd = new FormData();
        fd.append('type', 'product');
        fd.append('file', imageFile);
        const upRes = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageName = upRes.data.fileName;
      }
      const payload = { ...form, price: parseFloat(form.price), image: imageName };
      if (editing) {
        await API.put(`/products/${editing.id}`, payload);
        toast.success('Produit modifié');
      } else {
        await API.post('/products', payload);
        toast.success('Produit créé');
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
      await API.delete(`/products/${deleteTarget}`);
      toast.success('Supprimé');
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

  // Stats
  const totalProducts = totalItems;
  const totalCategories = categories.length;
  const avgPrice = products.length > 0
    ? (products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0) / products.length).toFixed(0)
    : 0;

  // Pagination calc
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
    for (let i = start; i <= end; i++) pages.push(i);
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
            <h1 className="text-2xl font-display font-bold text-gray-900">Produits</h1>
            <p className="text-sm text-gray-500">Gérez votre catalogue de produits</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-gray-900/20 hover:shadow-gray-900/30 hover:-translate-y-0.5"
        >
          <Plus size={18} /> Ajouter un produit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-gold-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            <p className="text-xs text-gray-500">Total produits</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Tag className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalCategories}</p>
            <p className="text-xs text-gray-500">Catégories</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{Number(avgPrice).toLocaleString()} DH</p>
            <p className="text-xs text-gray-500">Prix moyen</p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <FormModal open={showForm} onClose={() => setShowForm(false)}
        title={editing ? 'Modifier le produit' : 'Nouveau produit'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie</label>
            <select name="category_id" value={form.category_id} onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all" required>
              <option value="">Choisir une catégorie</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Titre du produit"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix (DH)</label>
            <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="0.00"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image</label>
            {form.image && !imageFile && (
              <div className="mb-2 relative inline-block">
                <img src={`/uploads/products/${form.image}`} alt="" className="h-24 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, image: '' }))}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100 file:transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description du produit..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all resize-none" rows={3} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={uploading}
              className="flex-1 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 disabled:from-gray-300 disabled:to-gray-300 text-white text-sm font-medium py-2.5 rounded-full transition-all shadow-lg shadow-gray-900/10">
              {uploading ? 'En cours...' : (editing ? 'Modifier' : 'Créer')}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium py-2.5 px-6 rounded-full transition-all">Annuler</button>
          </div>
        </form>
      </FormModal>

      <ConfirmModal open={!!deleteTarget} title="Supprimer le produit"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer ce produit ?"
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-3 items-end justify-between">
          <div className="flex flex-wrap gap-3 items-end flex-1">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Rechercher un produit..."
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
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium">Aucun produit trouvé</p>
          <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres ou ajoutez un nouveau produit</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-6">
          {products.map(pr => (
            <div key={pr.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
              {/* Image */}
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                {pr.image ? (
                  <img src={`/uploads/products/${pr.image}`} alt={pr.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(pr)} className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-gold-600 hover:text-gold-700 hover:bg-white shadow-sm transition-all">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(pr.id)} className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-red-500 hover:text-red-700 hover:bg-white shadow-sm transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gold-700 shadow-sm">
                    {Number(pr.price).toLocaleString()} DH
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-display font-semibold text-gray-900 line-clamp-1">{pr.title}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-gold-400"></span>
                  {pr.category_title || 'Sans catégorie'}
                </p>
                {pr.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{pr.description}</p>
                )}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button onClick={() => openEdit(pr)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-gold-600 hover:text-gold-700 hover:bg-gold-50 rounded-xl font-medium transition-all">
                    <Pencil size={14} /> Modifier
                  </button>
                  <button onClick={() => setDeleteTarget(pr.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl font-medium transition-all">
                    <Trash2 size={14} /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-500">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Produit</th>
                  <th className="px-6 py-3.5 font-medium">Catégorie</th>
                  <th className="px-6 py-3.5 font-medium">Prix</th>
                  <th className="px-6 py-3.5 font-medium hidden md:table-cell">Description</th>
                  <th className="px-6 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(pr => (
                  <tr key={pr.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                          {pr.image ? (
                            <img src={`/uploads/products/${pr.image}`} alt={pr.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                              <span className="text-sm font-display text-gray-300">{pr.title?.[0]}</span>
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-sm text-gray-900">{pr.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{pr.category_title || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{Number(pr.price).toLocaleString()} DH</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell max-w-xs">
                      <p className="line-clamp-1">{pr.description || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(pr)} className="p-2 text-gray-400 hover:text-gold-600 hover:bg-gold-50 rounded-xl transition-all">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(pr.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
}