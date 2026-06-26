import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, X, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import FormModal from '../../components/FormModal';
import ConfirmModal from '../../components/ConfirmModal';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', image: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;

  const fetch = () => {
    API.get('/categories').then(res => setCategories(res.data)).catch(() => {}).finally(() => setLoading(false));
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
    setImagePreview(cat.image ? `/uploads/categories/${cat.image}` : null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, image: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Le titre est obligatoire');
    setUploading(true);
    try {
      let imageName = form.image;
      if (imageFile) {
        const fd = new FormData();
        fd.append('type', 'category');
        fd.append('file', imageFile);
        const upRes = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageName = upRes.data.fileName;
      }
      const payload = { title: form.title, description: form.description, image: imageName };
      if (editing) {
        await API.put(`/categories/${editing}`, payload);
        toast.success('Catégorie modifiée');
      } else {
        await API.post('/categories', payload);
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
    try { await API.delete(`/categories/${deleteTarget}`); toast.success('Supprimée'); fetch(); setDeleteTarget(null); }
    catch { toast.error('Erreur'); }
    finally { setDeleting(false); }
  };

  // Pagination
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const paginatedCategories = categories.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const nextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages - 1));
  const prevPage = () => setCurrentPage(p => Math.max(p - 1, 0));

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Catégories</h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 hidden sm:block">{categories.length} catégorie(s)</p>
            </div>
            <button 
              onClick={openCreate} 
              className="bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white text-sm font-medium px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-gray-900/10 hover:shadow-xl hover:shadow-gray-900/20 active:scale-95"
            >
              <Plus size={16} className="hidden sm:block" />
              <span className="hidden sm:inline">Ajouter</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Modal */}
        <FormModal open={showModal} onClose={() => setShowModal(false)}
          title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Image</label>
              <div className="relative">
                {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-100">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-gold-400 hover:bg-gold-50/50 transition-all group">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-gray-100 group-hover:bg-gold-100 rounded-full transition-all">
                        <ImageIcon size={20} className="text-gray-400 group-hover:text-gold-600" />
                      </div>
                      <span className="text-sm text-gray-400 group-hover:text-gold-600">Cliquez pour ajouter une image</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Titre <span className="text-red-500">*</span></label>
              <input 
                value={form.title} 
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all placeholder:text-gray-300"
                placeholder="Ex: Mariage, Fiançailles..." 
                required 
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all resize-none placeholder:text-gray-300"
                rows={3} 
                placeholder="Description de la catégorie..." 
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button 
                type="submit" 
                disabled={uploading}
                className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium py-3 rounded-xl transition-all active:scale-[0.98]"
              >
                {uploading ? 'En cours...' : (editing ? 'Modifier' : 'Ajouter')}
              </button>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all active:scale-[0.98]"
              >
                Annuler
              </button>
            </div>
          </form>
        </FormModal>

        {/* Delete Modal */}
        <ConfirmModal 
          open={!!deleteTarget} 
          title="Supprimer la catégorie"
          message="Cette action est irréversible. Voulez-vous vraiment supprimer cette catégorie ?"
          onConfirm={handleDelete} 
          onCancel={() => setDeleteTarget(null)} 
          loading={deleting} 
        />

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-gold-500" />
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ImageIcon size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">Aucune catégorie</p>
            <p className="text-sm text-gray-300 mt-1">Commencez par en ajouter une</p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {paginatedCategories.map(cat => (
                <div key={cat.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-900/5 transition-all duration-300 active:scale-[0.98] sm:active:scale-100">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-900 via-stone-800 to-rose-900">
                    {cat.image ? (
                      <img 
                        src={`/uploads/categories/${cat.image}`} 
                        alt={cat.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl font-bold text-white/10">{cat.title[0]}</span>
                      </div>
                    )}
                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button 
                        onClick={() => openEdit(cat)}
                        className="bg-white/90 hover:bg-white text-gray-900 p-2.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(cat.id)}
                        className="bg-white/90 hover:bg-white text-red-500 p-2.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg">{cat.title}</h3>
                    {cat.description && (
                      <p className="text-sm text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{cat.description}</p>
                    )}
                    
                    {/* Mobile actions (visible only on small screens) */}
                    <div className="flex gap-2 mt-3 sm:hidden">
                      <button 
                        onClick={() => openEdit(cat)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-gray-50 text-gray-700 py-2 rounded-lg active:bg-gray-100"
                      >
                        <Pencil size={12} /> Modifier
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(cat.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-red-50 text-red-600 py-2 rounded-lg active:bg-red-100"
                      >
                        <Trash2 size={12} /> Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button 
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-gray-500 font-medium">
                  {currentPage + 1} / {totalPages}
                </span>
                <button 
                  onClick={nextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}