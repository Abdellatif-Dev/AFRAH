import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import { Trash, Plus, X, UploadCloud, Edit, AlertTriangle } from 'lucide-react';

export default function UploadMedia() {
  const [slides, setSlides] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null); // الـ state الخاص بالتعديل

  const [filePc, setFilePc] = useState(null);
  const [fileMobile, setFileMobile] = useState(null);

  const [previewPc, setPreviewPc] = useState(null);
  const [previewMobile, setPreviewMobile] = useState(null);

  const [uploading, setUploading] = useState(false);

  // state ديال modal الحذف
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSlides = async () => {
    try {
      const res = await API.get('/slides');
      setSlides(res.data);
    } catch { 
      toast.error('Erreur de chargement'); 
    }
  };

  useEffect(() => { 
    fetchSlides(); 
  }, []);

  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleOpenAddModal = () => {
    setEditingSlide(null);
    setFilePc(null); setFileMobile(null);
    setPreviewPc(null); setPreviewMobile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slide) => {
    setEditingSlide(slide);
    setFilePc(null); setFileMobile(null);
    // كنأفيشيو التصاور القدام كـ Preview
    setPreviewPc(`/uploads/slides/${slide.image}`);
    setPreviewMobile(`/uploads/slides/${slide.image_mobile}`);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // فالحالة ديال إضافة جديدة، خاص ضروري تختارهم بجوج
    if (!editingSlide && (!filePc || !fileMobile)) {
      toast.error('اختاري التصاور بجوج عافاك');
      return;
    }

    setUploading(true);
    const fd = new FormData();
    if (filePc) fd.append('filePc', filePc);
    if (fileMobile) fd.append('fileMobile', fileMobile);

    try {
      let pcName = editingSlide?.image || null;
      let mobileName = editingSlide?.image_mobile || null;

      // يلا ترفعات شي تصويرة جديدة، كنصيفطوها للسيرفر
      if (filePc || fileMobile) {
        const upRes = await API.post('/upload/dual', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (filePc) pcName = upRes.data.pcName;
        if (fileMobile) mobileName = upRes.data.mobileName;
      }

      if (editingSlide) {
        // حالة التعديل (PUT) [1]
        await API.put(`/slides/${editingSlide.id}`, {
          image: pcName,
          image_mobile: mobileName
        });
        toast.success('تم التعديل بنجاح');
      } else {
        // حالة إضافة جديدة (POST) [1]
        await API.post('/slides', { 
          image: pcName, 
          image_mobile: mobileName 
        });
        toast.success('تمت الإضافة بنجاح');
      }

      setIsModalOpen(false);
      fetchSlides();
    } catch { 
      toast.error('خطأ أثناء العملية'); 
    } finally { 
      setUploading(false); 
    }
  };

  // كنحلو modal الحذف عوض window.confirm
  const handleDelete = (slide) => {
    setSlideToDelete(slide);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!slideToDelete) return;
    setDeleting(true);
    try {
      await API.delete(`/slides/${slideToDelete.id}`);
      toast.success('Supprimée');
      setDeleteModalOpen(false);
      setSlideToDelete(null);
      fetchSlides();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Slides</h1>
        <button onClick={handleOpenAddModal} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition">
          <Plus size={20} /> Ajouter Slide
        </button>
      </div>

      {/* Modal Design */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingSlide ? 'Modifier la Slide' : 'Nouvelle Slide'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-red-500" /></button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {/* PC Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-600">PC Version (1400x780)</label>
                <div className="border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 overflow-hidden relative">
                  {previewPc ? <img src={previewPc} className="w-full h-full object-cover" /> : <UploadCloud className="text-gray-400" />}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setFilePc, setPreviewPc)} />
                </div>
              </div>

              {/* Mobile Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-600">Mobile Version</label>
                <div className="border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 overflow-hidden relative">
                  {previewMobile ? <img src={previewMobile} className="w-full h-full object-cover" /> : <UploadCloud className="text-gray-400" />}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, setFileMobile, setPreviewMobile)} />
                </div>
              </div>

              <button type="submit" disabled={uploading} className="col-span-2 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
                {uploading ? 'En cours...' : editingSlide ? 'Modifier' : 'Sauvegarder'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal ديال تأكيد الحذف */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="bg-red-100 text-red-600 rounded-full p-3">
                <AlertTriangle size={28} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Supprimer cette slide ?</h2>
              <p className="text-sm text-gray-500">
                Cette action est irréversible. La slide sera supprimée définitivement.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setDeleteModalOpen(false); setSlideToDelete(null); }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-60"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* الجدول */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">PC</th>
              <th className="p-4">Mobile</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slides.length === 0 ? (
              <tr><td colSpan={3} className="p-8 text-center text-gray-400">Aucune slide</td></tr>
            ) : slides.map(s => (
              <tr key={s.id} className="border-b">
                <td className="p-4">
                  <img src={`/uploads/slides/${s.image}`} className="h-16 w-32 object-cover rounded" alt="slide pc" />
                </td>
                <td className="p-4">
                  <img src={`/uploads/slides/${s.image_mobile}`} className="h-16 w-9 object-cover rounded" alt="slide mobile" />
                </td>
                <td className="p-4 text-right flex items-center gap-3 justify-end">
                  <button onClick={() => handleOpenEditModal(s)} className="text-blue-500 hover:text-blue-700 flex items-center gap-1">
                    <Edit size={16} /> Modifier
                  </button>
                  <button onClick={() => handleDelete(s)} className="text-red-500 hover:text-red-700 flex items-center gap-1">
                    <Trash size={16} /> Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}