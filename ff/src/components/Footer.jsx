import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import API from '../api/axios';
import { Phone, Mail, MapPin } from 'lucide-react';
import { FaInstagram, FaFacebook, FaTwitter, FaTiktok, FaWhatsapp } from 'react-icons/fa';

const socialIcons = {
  instagram: { icon: FaInstagram, hover: 'hover:text-pink-600' },
  facebook: { icon: FaFacebook, hover: 'hover:text-blue-600' },
  twitter: { icon: FaTwitter, hover: 'hover:text-sky-500' },
  tiktok: { icon: FaTiktok, hover: 'hover:text-gray-800' },
};

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    API.get('/settings').then(res => setSettings(res.data)).catch(() => {});
  }, []);

  const socialLinks = settings ? [
    { key: 'instagram', url: settings.instagram },
    { key: 'facebook', url: settings.facebook },
    { key: 'twitter', url: settings.twitter },
    { key: 'tiktok', url: settings.tiktok },
  ].filter(s => s.url) : [];

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            {settings?.logo ? (
              <img src={`/uploads/settings/${settings.logo}`} alt="Afrah" className="h-12 mb-4 object-contain" />
            ) : (
              <h3 className="text-2xl font-display font-bold bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent mb-4">Afrah</h3>
            )}
            {settings?.footer_description ? (
              <p className="text-sm text-gray-400 leading-relaxed">{settings.footer_description}</p>
            ) : (
              <p className="text-sm text-gray-400 leading-relaxed">Des moments inoubliables. Organisation de mariages et d'événements avec élégance et soin.</p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-4">Navigation</h4>
            <div className="space-y-3">
              <Link to="/" className="block text-sm text-gray-400 hover:text-gray-900 transition-colors">Accueil</Link>
              <Link to="/events" className="block text-sm text-gray-400 hover:text-gray-900 transition-colors">Événements</Link>
              <Link to="/packages" className="block text-sm text-gray-400 hover:text-gray-900 transition-colors">Forfaits</Link>
              <Link to="/order" className="block text-sm text-gray-400 hover:text-gray-900 transition-colors">Réserver</Link>
              <Link to="/contact" className="block text-sm text-gray-400 hover:text-gray-900 transition-colors">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-4">Contact</h4>
            <div className="space-y-3 text-sm text-gray-400">
              {settings?.phone && <p className="flex items-center gap-2"><Phone size={13} className="text-gray-300" />{settings.phone}</p>}
              {settings?.email && <p className="flex items-center gap-2"><Mail size={13} className="text-gray-300" />{settings.email}</p>}
              {settings?.address && <p className="flex items-center gap-2"><MapPin size={13} className="text-gray-300" />{settings.address}</p>}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-4">Suivez-nous</h4>
            <div className="flex gap-3 flex-wrap">
              {socialLinks.map(s => {
                const Icon = socialIcons[s.key]?.icon;
                if (!Icon) return null;
                return (
                  <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer"
                    className={`w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gold-50 ${socialIcons[s.key].hover} transition-all`}>
                    <Icon size={15} />
                  </a>
                );
              })}
              {settings?.whatsapp_chat && (
                <a href={`https://wa.me/${settings.whatsapp_chat.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-green-50 hover:text-green-600 transition-all">
                  <FaWhatsapp size={15} />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} Afrah. Tous droits réservés.</p>
          <div className="flex gap-6">
            <span className="hover:text-gray-900 transition-colors cursor-pointer">Confidentialité</span>
            <span className="hover:text-gray-900 transition-colors cursor-pointer">CGV</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
