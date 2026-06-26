import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-react';
import { FaInstagram, FaFacebook, FaTwitter, FaTiktok, FaWhatsapp } from 'react-icons/fa';

export default function Contact() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    API.get('/settings').then(res => setSettings(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error('Tous les champs sont obligatoires');
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/contacts', form);
      toast.success('Message envoyé avec succès ! Nous vous répondrons bientôt.');
      setForm({ name: '', phone: '', message: '' });
    } catch {
      toast.error("Echec de l'envoi du message. Veuillez ressayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const socialLinks = settings ? [
    { key: 'instagram', url: settings.instagram },
    { key: 'facebook', url: settings.facebook },
    { key: 'twitter', url: settings.twitter },
    { key: 'tiktok', url: settings.tiktok },
  ].filter(s => s.url) : [];

  return (
    <div className="min-h-screen bg-[#fafafa] py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs font-semibold text-gold-600 uppercase tracking-[0.2em]">Contact</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-3">Contactez-Nous</h1>
          <div className="w-10 h-0.5 bg-gold-400 mx-auto mt-4 rounded-full" />
          <p className="text-sm text-gray-400 mt-3">Une question ? Nous serions ravis de vous entendre</p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 md:gap-12 max-w-4xl mx-auto">
          <div className="md:col-span-2 space-y-4">
            {settings?.phone && (
              <a href={`tel:${settings.phone}`} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 block hover:shadow-md transition">
                <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center mb-4">
                    <Phone className="w-5 h-5 text-gold-600" />
                </div>
                <h3 className="font-display font-semibold text-gray-900">Téléphone</h3>
                <p className="text-sm text-gray-400 mt-1">{settings.phone}</p>
              </a>
            )}

            {settings?.email && (
              <a href={`mailto:${settings.email}`} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 block hover:shadow-md transition">
                <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center mb-4">
                    <Mail className="w-5 h-5 text-gold-600" />
                </div>
                <h3 className="font-display font-semibold text-gray-900">Email</h3>
                <p className="text-sm text-gray-400 mt-1">{settings.email}</p>
              </a>
            )}

            {settings?.address && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center mb-4">
                  <MapPin className="w-5 h-5 text-gold-600" />
                </div>
                <h3 className="font-display font-semibold text-gray-900">Adresse</h3>
                <p className="text-sm text-gray-400 mt-1">{settings.address}</p>
              </div>
            )}

            {socialLinks.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                <h3 className="font-display font-semibold text-gray-900 mb-4">Réseaux sociaux</h3>
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const icons = { instagram: FaInstagram, facebook: FaFacebook, twitter: FaTwitter, tiktok: FaTiktok };
                    return socialLinks.map(s => {
                      const Icon = icons[s.key];
                      if (!Icon) return null;
                      return (
                        <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gold-50 flex items-center justify-center transition group">
                          <Icon className="w-4 h-4 text-gray-500 group-hover:text-gold-600 transition" />
                        </a>
                      );
                    });
                  })()}
                  {settings?.whatsapp_chat && (
                    <a href={`https://wa.me/${settings.whatsapp_chat.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-green-50 flex items-center justify-center transition group">
                      <FaWhatsapp className="w-4 h-4 text-gray-500 group-hover:text-green-600 transition" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-3 space-y-6">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-50 p-8 sm:p-10 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all placeholder:text-gray-300"
                  placeholder="Votre nom" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone *</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all placeholder:text-gray-300"
                  placeholder="Votre numéro" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                <textarea name="message" value={form.message} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all placeholder:text-gray-300 resize-none"
                  rows={4} placeholder="Votre message..." required />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium py-3.5 rounded-full transition-all shadow-sm hover:shadow-md">
                {submitting ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </form>

            {(() => {
              const url = settings?.map_url;
              if (!url) return null;
              const isEmbed = url.includes('/maps/embed');
              const coords = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
              let embedSrc = '';
              if (isEmbed) embedSrc = url;
              else if (coords) embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${+coords[2]-0.01},${+coords[1]-0.01},${+coords[2]+0.01},${+coords[1]+0.01}&layer=mapnik&marker=${coords[1]},${coords[2]}`;
              return embedSrc ? (
                <>
                  <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-50 h-72">
                    <iframe src={embedSrc} width="100%" height="100%" style={{ border: 0 }}
                      title="Localisation" />
                  </div>
                  {!isEmbed && (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-10 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition text-xs text-gray-500 hover:text-gray-700">
                      <ExternalLink size={14} />
                      Ouvrir dans Google Maps
                    </a>
                  )}
                </>
              ) : (
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition text-sm text-gray-600 hover:text-gray-900">
                  <MapPin size={18} />
                  Voir sur Google Maps
                </a>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
