import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, X, UploadCloud, Tag, Search, Image as ImageIcon, LayoutGrid } from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';

export default function ManageProductCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', image: '' });
  const [imageFile, setImageFile] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const fetch = () => {
    API.get('/product-categories').then(res => {
      setCategories(res.data || []);
    }).catch(() => {
      toast.error('Erreur de chargement');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', image: '' });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat.id);
    setForm({ title: cat.title, description: cat.description || '', image: cat.image || '' });
    setImageFile(null);
    setImagePreview(cat.image ? `/uploads/products/${cat.image}` : null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Le titre est obligatoire');
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
      const payload = { title: form.title.trim(), description: form.description, image: imageName };
      if (editing) {
        await API.put(`/product-categories/${editing}`, payload);
        toast.success('Catégorie modifiée');
      } else {
        await API.post('/product-categories', payload);
        toast.success('Catégorie créée');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ title: '', description: '', image: '' });
      setImageFile(null);
      setImagePreview(null);
      fetch();
    } catch { toast.error('Erreur'); }
    finally { setUploading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await API.delete(`/product-categories/${deleteTarget}`); toast.success('Supprimée'); fetch(); setDeleteTarget(null); }
    catch { toast.error('Erreur'); }
    finally { setDeleting(false); }
  };

  const filteredCategories = categories.filter(cat =>
    cat.title.toLowerCase().includes(search.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Catégories de produits</h1>
          <p className="text-sm text-gray-400 mt-0.5">{categories.length} catégorie{categories.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Nouvelle catégorie</span>
        </button>
      </div>

      {/* ═══ SEARCH ═══ */}
      {categories.length > 0 && (
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une catégorie..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all"
          />
        </div>
      )}

      {/* ═══ CATEGORIES GRID ═══ */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <LayoutGrid size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {search ? 'Aucune catégorie ne correspond à votre recherche' : 'Aucune catégorie pour le moment'}
          </p>
          {!search && (
            <button onClick={openCreate} className="mt-4 text-sm text-gold-600 font-medium hover:underline">
              Créer votre première catégorie
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCategories.map(cat => (
            <div
              key={cat.id}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Image Area */}
              <div className="relative h-40 overflow-hidden">
                {cat.image ? (
                  <img
                    src={`/uploads/products/${cat.image}`}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex items-center justify-center">
                    <span className="text-5xl font-display font-bold text-white/10">{cat.title?.[0]}</span>
                  </div>
                )}
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
                  <button
                    onClick={() => openEdit(cat)}
                    className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all bg-white text-gray-800 w-9 h-9 rounded-full flex items-center justify-center shadow-lg hover:bg-amber-50 hover:text-amber-600"
                    title="Modifier"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat.id)}
                    className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all delay-75 bg-white text-gray-800 w-9 h-9 rounded-full flex items-center justify-center shadow-lg hover:bg-rose-50 hover:text-rose-600"
                    title="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {/* Product count badge (if you have products count) */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 backdrop-blur text-[10px] font-semibold text-gray-700 shadow-sm">
                    <Tag size={10} />
                    {cat.title}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{cat.title}</h3>
                {cat.description ? (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{cat.description}</p>
                ) : (
                  <p className="text-xs text-gray-300 mt-1 italic">Pas de description</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-gray-900">
                {editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Titre <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Nom de la catégorie"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all"
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Image
                </label>
                {(imagePreview || form.image) && (
                  <div className="mb-3 relative inline-block group">
                    <img
                      src={imagePreview || `/uploads/products/${form.image}`}
                      alt="Preview"
                      className="h-28 rounded-xl object-cover shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon size={20} className="text-white" />
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all">
                  <UploadCloud size={18} className="text-gray-400" />
                  <span className="text-sm text-gray-500 truncate">
                    {imageFile ? imageFile.name : 'Choisir une image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Description de la catégorie..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all resize-none"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                  {uploading ? 'En cours...' : (editing ? 'Enregistrer' : 'Créer')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ CONFIRM MODAL ═══ */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Supprimer la catégorie"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer cette catégorie ?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}