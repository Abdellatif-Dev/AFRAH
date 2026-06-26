import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../../api/axios';

export default function UploadMedia() {
  const [slides, setSlides] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSlides = async () => {
    try {
      const res = await API.get('/slides');
      setSlides(res.data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Sélectionnez une image'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('type', 'slide');
      fd.append('file', file);
      const upRes = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await API.post('/slides', { image: upRes.data.fileName });
      toast.success('Slide ajoutée');
      setFile(null);
      fetchSlides();
    } catch { toast.error('Erreur'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette slide ?')) return;
    try { await API.delete(`/slides/${id}`); toast.success('Supprimée'); fetchSlides(); }
    catch { toast.error('Erreur'); }
  };

  if (loading) return <p className="text-gray-400 text-center py-8">Chargement...</p>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">Slides du Héros (Home Page)</h1>

      <form onSubmit={handleUpload} className="bg-white rounded-xl shadow-md p-8 max-w-lg mb-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          <input type="file" accept="image/*"
            onChange={e => setFile(e.target.files[0])}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100" />
        </div>
        <button type="submit" disabled={uploading}
          className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-all">
          {uploading ? 'En cours...' : 'Ajouter'}
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-500">
            <tr>
              <th className="px-6 py-3">Image</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {slides.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">Aucune slide</td></tr>
            ) : slides.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <img src={`/uploads/slides/${s.image}`} alt=""
                    className="h-20 w-36 object-cover rounded-lg" />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.created_at?.slice(0, 10)}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(s.id)}
                    className="text-sm text-red-500 hover:text-red-700 font-medium">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
