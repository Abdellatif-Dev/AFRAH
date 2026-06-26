import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Search, Image, Video, Trash2, Edit3, X, ChevronLeft, ChevronRight, Filter, Calendar, MapPin, MoreHorizontal, UploadCloud } from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category_id: '', title: '', image: '', address: '', description: '' });
  const [coverFile, setCoverFile] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);

  const [showMedia, setShowMedia] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [mediaUploading, setMediaUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMediaTarget, setDeleteMediaTarget] = useState(null);
  const [deletingMedia, setDeletingMedia] = useState(false);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchData = async (searchTerm = search, catId = filterCategory, pageNum = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: String(limit), page: String(pageNum) });
      if (searchTerm) params.append('search', searchTerm);
      if (catId) params.append('category_id', catId);
      const [evRes, catRes] = await Promise.all([
        API.get(`/events?${params}`),
        API.get('/categories')
      ]);
      setEvents(evRes.data.events || []);
      setTotal(evRes.data.total || 0);
      setCategories(catRes.data || []);
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => {
      setPage(1);
      fetchData(val, filterCategory, 1);
    }, 300));
  };

  const handleCategoryFilter = (e) => {
    const val = e.target.value;
    setFilterCategory(val);
    setPage(1);
    fetchData(search, val, 1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchData(search, filterCategory, newPage);
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditing(null);
    setForm({ category_id: categories[0]?.id || '', title: '', image: '', address: '', description: '' });
    setCoverFile(null);
    setShowForm(true);
  };

  const openEdit = (ev) => {
    setEditing(ev);
    setForm({ category_id: ev.category_id || '', title: ev.title, image: ev.image || '', address: ev.address || '', description: ev.description || '' });
    setCoverFile(null);
    setShowForm(true);
  };

  const handleCoverUpload = async (file) => {
    if (!file) return form.image;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append('type', 'image');
      fd.append('file', file);
      const res = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data.fileName;
    } catch { toast.error('Erreur upload cover'); return null; }
    finally { setCoverUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageName = form.image;
      if (coverFile) {
        const uploaded = await handleCoverUpload(coverFile);
        if (uploaded) imageName = uploaded;
      }
      const payload = { ...form, image: imageName };
      if (editing) {
        await API.put(`/events/${editing.id}`, payload);
        toast.success('Événement modifié');
      } else {
        await API.post('/events', payload);
        toast.success('Événement créé');
      }
      setShowForm(false);
      setEditing(null);
      setCoverFile(null);
      fetchData();
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await API.delete(`/events/${deleteTarget}`); toast.success('Supprimé'); fetchData(); setDeleteTarget(null); }
    catch { toast.error('Erreur'); }
    finally { setDeleting(false); }
  };

  const openMediaPanel = async (ev) => {
    setShowMedia(ev);
    try { const res = await API.get(`/events/${ev.id}`); setMediaList(res.data.media || []); }
    catch { setMediaList([]); }
  };

  const handleMediaUpload = async () => {
    if (!mediaFile) { toast.error('Sélectionnez un fichier'); return; }
    setMediaUploading(true);
    try {
      const fd = new FormData();
      fd.append('type', mediaType === 'video' ? 'video' : 'image');
      fd.append('file', mediaFile);
      const upRes = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await API.post('/upload/event-media', { event_id: showMedia.id, type: mediaType, file_name: upRes.data.fileName });
      toast.success('Media ajouté');
      setMediaFile(null);
      const res = await API.get(`/events/${showMedia.id}`);
      setMediaList(res.data.media || []);
    } catch { toast.error('Erreur'); }
    finally { setMediaUploading(false); }
  };

  const handleMediaDelete = async () => {
    if (!deleteMediaTarget) return;
    setDeletingMedia(true);
    try { await API.delete(`/upload/event-media/${deleteMediaTarget}`); toast.success('Supprimé'); setMediaList(prev => prev.filter(m => m.id !== deleteMediaTarget)); setDeleteMediaTarget(null); }
    catch { toast.error('Erreur'); }
    finally { setDeletingMedia(false); }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && events.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Événements</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} événement{total !== 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Nouvel événement</span>
        </button>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Rechercher par titre, adresse, description..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all"
          />
        </div>
        <div className="relative sm:w-56">
          <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterCategory}
            onChange={handleCategoryFilter}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all appearance-none cursor-pointer"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </div>

      {/* ═══ EVENTS GRID (Mobile) / TABLE (Desktop) ═══ */}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Événement</th>
              <th className="px-6 py-3.5">Catégorie</th>
              <th className="px-6 py-3.5">Adresse</th>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar size={40} className="text-gray-200" />
                    <p className="text-gray-400 text-sm">Aucun événement trouvé</p>
                  </div>
                </td>
              </tr>
            ) : events.map(ev => (
              <tr key={ev.id} className="group hover:bg-gray-50/60 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    {ev.image ? (
                      <img src={`/uploads/events/${ev.image}`} alt="" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-900 via-stone-800 to-rose-900 flex items-center justify-center shadow-sm">
                        <span className="text-sm font-display font-bold text-white/30">{ev.title?.[0]}</span>
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{ev.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-[200px]">{ev.description || 'Pas de description'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gold-50 text-gold-700 text-xs font-medium">
                    {ev.category_title || '—'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin size={13} className="text-gray-300 shrink-0" />
                    <span className="truncate max-w-[150px]">{ev.address || '—'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">{ev.created_at?.slice(0, 10)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openMediaPanel(ev)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-600 transition-colors"
                      title="Médias"
                    >
                      <Image size={16} />
                    </button>
                    <button
                      onClick={() => openEdit(ev)}
                      className="p-2 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-colors"
                      title="Modifier"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(ev.id)}
                      className="p-2 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Calendar size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucun événement trouvé</p>
          </div>
        ) : events.map(ev => (
          <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex gap-4">
              {ev.image ? (
                <img src={`/uploads/events/${ev.image}`} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-900 via-stone-800 to-rose-900 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-lg font-display font-bold text-white/30">{ev.title?.[0]}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{ev.title}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gold-50 text-gold-700 text-[10px] font-medium shrink-0">
                    {ev.category_title || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                  <MapPin size={11} />
                  <span className="truncate">{ev.address || 'Pas d\'adresse'}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                  <Calendar size={11} />
                  <span>{ev.created_at?.slice(0, 10)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
              <button onClick={() => openMediaPanel(ev)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">
                <Image size={13} /> Médias
              </button>
              <button onClick={() => openEdit(ev)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-colors">
                <Edit3 size={13} /> Modifier
              </button>
              <button onClick={() => setDeleteTarget(ev.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-50 text-rose-500 text-xs font-medium hover:bg-rose-100 transition-colors">
                <Trash2 size={13} /> Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ PAGINATION ═══ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">
            Page {page} sur {totalPages} · {total} résultats
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-500 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  p === page
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-500 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══ CREATE/EDIT MODAL ═══ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-gray-900">{editing ? "Modifier l'événement" : 'Nouvel événement'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Catégorie</label>
                <select name="category_id" value={form.category_id} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all"
                  required>
                  <option value="">Choisir une catégorie</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Titre</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="Nom de l'événement"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Image de couverture</label>
                {form.image && !coverFile && (
                  <div className="mb-3 relative inline-block group">
                    <img src={`/uploads/events/${form.image}`} alt="" className="h-28 rounded-xl object-cover shadow-sm" />
                    <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Image actuelle</span>
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all">
                  <UploadCloud size={18} className="text-gray-400" />
                  <span className="text-sm text-gray-500">{coverFile ? coverFile.name : 'Choisir une image'}</span>
                  <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files[0])} className="hidden" />
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Adresse</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input name="address" value={form.address} onChange={handleChange} placeholder="Lieu de l'événement"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Décrivez l'événement..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all resize-none" rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={coverUploading}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95">
                  {coverUploading ? 'Upload en cours...' : editing ? 'Enregistrer' : 'Créer'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MEDIA MODAL ═══ */}
      {showMedia && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMedia(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">Médias</h2>
                <p className="text-xs text-gray-400 mt-0.5">{showMedia.title}</p>
              </div>
              <button onClick={() => setShowMedia(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
              <select value={mediaType} onChange={e => setMediaType(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400">
                <option value="image">Image</option>
                <option value="video">Vidéo</option>
              </select>
              <label className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-white border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all">
                <UploadCloud size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500 truncate">{mediaFile ? mediaFile.name : `Choisir un fichier ${mediaType}`}</span>
                <input type="file" accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                  onChange={e => setMediaFile(e.target.files[0])} className="hidden" />
              </label>
              <button onClick={handleMediaUpload} disabled={mediaUploading}
                className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all shadow-sm active:scale-95">
                {mediaUploading ? '...' : 'Ajouter'}
              </button>
            </div>

            {mediaList.length === 0 ? (
              <div className="text-center py-12">
                <Image size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Aucun média pour cet événement</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mediaList.map(m => (
                  <div key={m.id} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
                    {m.type === 'video' ? (
                      <video src={`/uploads/videos/${m.file_name}`} className="w-full h-full object-cover" />
                    ) : (
                      <img src={`/uploads/events/${m.file_name}`} alt="" className="w-full h-full object-cover" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <button onClick={() => setDeleteMediaTarget(m.id)}
                        className="opacity-0 group-hover:opacity-100 transition-all bg-white text-red-500 w-9 h-9 rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transform scale-90 group-hover:scale-100">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                        m.type === 'video' ? 'bg-purple-500/80 text-white' : 'bg-white/80 text-gray-700'
                      }`}>
                        {m.type === 'video' ? <Video size={10} /> : <Image size={10} />}
                        {m.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CONFIRM MODALS ═══ */}
      <ConfirmModal open={!!deleteTarget} title="Supprimer l'événement"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer cet événement ?"
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      <ConfirmModal open={!!deleteMediaTarget} title="Supprimer le média"
        message="Voulez-vous vraiment supprimer ce média ?"
        onConfirm={handleMediaDelete} onCancel={() => setDeleteMediaTarget(null)} loading={deletingMedia} />
    </div>
  );
}