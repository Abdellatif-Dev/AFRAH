import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import { Building2, Phone, Mail, MapPin, Type, Globe, Save, Loader2, Image, MessageCircle, Smartphone } from 'lucide-react';
import { FaInstagram, FaFacebook, FaTwitter, FaTiktok, FaWhatsapp } from 'react-icons/fa';

const sections = [
  { id: 'general', label: 'Général', icon: Building2 },
  { id: 'social', label: 'Réseaux sociaux', icon: Globe },
  { id: 'map', label: 'Carte', icon: MapPin },
  { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
];

const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all";

export default function Settings() {
  const [form, setForm] = useState({
    phone: '', email: '', address: '', logo: '',
    instagram: '', facebook: '', twitter: '', tiktok: '', whatsapp_chat: '', map_url: '', footer_description: '', admin_whatsapp: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    API.get('/settings').then(res => {
      setForm(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let logoName = form.logo;
      if (logoFile) {
        const fd = new FormData();
        fd.append('type', 'logo');
        fd.append('file', logoFile);
        const upRes = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        logoName = upRes.data.fileName;
      }
      await API.put('/settings', { ...form, logo: logoName });
      setForm(prev => ({ ...prev, logo: logoName }));
      setLogoFile(null);
      toast.success('Paramètres mis à jour');
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-gold-500" size={32} />
    </div>
  );

  const Icon = sections.find(s => s.id === activeSection)?.icon || Building2;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-400 mt-1">Gérez les informations générales de votre plateforme</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-100 pb-1">
        {sections.map(s => {
          const SecIcon = s.icon;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSection === s.id ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
              <SecIcon size={16} />
              {s.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        {activeSection === 'general' && (
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la plateforme</label>
                <div className="flex items-center gap-4">
                  {form.logo && !logoFile && (
                    <div className="w-20 h-20 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <img src={`/uploads/settings/${form.logo}`} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gold-300 hover:bg-gold-50/30 transition-all text-sm text-gray-500">
                      <Image size={18} />
                      {logoFile ? logoFile.name : 'Changer le logo'}
                      <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input name="phone" value={form.phone} onChange={handleChange} className={inputClass + ' pl-10'} placeholder="+212 6 XX XX XX XX" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass + ' pl-10'} placeholder="contact@afrah.ma" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input name="address" value={form.address} onChange={handleChange} className={inputClass + ' pl-10'} placeholder="Casablanca, Maroc" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description du footer</label>
                <div className="relative">
                  <Type size={16} className="absolute left-3 top-3 text-gray-300" />
                  <textarea name="footer_description" value={form.footer_description} onChange={handleChange} className={inputClass + ' pl-10 resize-none'} rows={3}
                    placeholder="Des moments inoubliables. Organisation de mariages et d'événements avec élégance et soin." />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'social' && (
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <FaInstagram size={16} className="text-pink-500" /> Instagram
                </label>
                <input name="instagram" value={form.instagram} onChange={handleChange} className={inputClass} placeholder="https://instagram.com/votrepage" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <FaFacebook size={16} className="text-blue-600" /> Facebook
                </label>
                <input name="facebook" value={form.facebook} onChange={handleChange} className={inputClass} placeholder="https://facebook.com/votrepage" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <FaTwitter size={16} className="text-sky-500" /> Twitter / X
                </label>
                <input name="twitter" value={form.twitter} onChange={handleChange} className={inputClass} placeholder="https://twitter.com/votrepage" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <FaTiktok size={16} className="text-gray-800" /> TikTok
                </label>
                <input name="tiktok" value={form.tiktok} onChange={handleChange} className={inputClass} placeholder="https://tiktok.com/@votrepage" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <FaWhatsapp size={16} className="text-green-500" /> WhatsApp (numéro)
                </label>
                <input name="whatsapp_chat" value={form.whatsapp_chat} onChange={handleChange} className={inputClass} placeholder="+2126XXXXXXXX" />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'map' && (
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <MapPin size={16} /> Lien Google Maps
              </label>
              <input name="map_url" value={form.map_url} onChange={handleChange} className={inputClass} placeholder="https://www.google.com/maps/place/..." />
              <p className="text-xs text-gray-400 mt-1.5">Collez un lien Google Maps (place ou embed). Si les coordonnées sont détectées, une carte s'affichera sur la page contact.</p>
            </div>
            {form.map_url && (
              <div className="rounded-xl overflow-hidden border border-gray-100 h-48 bg-gray-50">
                <iframe
                  src={(() => {
                    const coords = form.map_url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                    if (form.map_url.includes('/maps/embed')) return form.map_url;
                    if (coords) return `https://www.openstreetmap.org/export/embed.html?bbox=${+coords[2]-0.005},${+coords[1]-0.005},${+coords[2]+0.005},${+coords[1]+0.005}&layer=mapnik&marker=${coords[1]},${coords[2]}`;
                    return '';
                  })()}
                  width="100%" height="100%" style={{ border: 0 }} title="Aperçu carte" />
              </div>
            )}
          </div>
        )}

        {activeSection === 'whatsapp' && (
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <Smartphone size={16} /> Numéro admin pour notifications WhatsApp
              </label>
              <input name="admin_whatsapp" value={form.admin_whatsapp} onChange={handleChange} className={inputClass} placeholder="0679990934" />
              <p className="text-xs text-gray-400 mt-1.5">Si le client n'a pas WhatsApp, la notification de commande vous sera envoyée à ce numéro.</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-700 space-y-2">
              <p className="font-medium">Configuration WhatsApp</p>
              <p>Allez dans <strong>WhatsApp</strong> depuis le menu admin pour scanner le QR code et connecter votre WhatsApp.</p>
              <p>Une fois connecté :</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✓ Un message de confirmation est envoyé au <strong>numéro du client</strong>.</li>
                <li>✓ Si le client n'est pas sur WhatsApp, le message vous est envoyé au numéro ci-dessus.</li>
              </ul>
            </div>
          </div>
        )}

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Toutes les modifications sont sauvegardées immédiatement</p>
          <button type="submit" disabled={saving}
            className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium px-8 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md flex items-center gap-2">
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> En cours...</>
            ) : (
              <><Save size={16} /> Enregistrer</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
