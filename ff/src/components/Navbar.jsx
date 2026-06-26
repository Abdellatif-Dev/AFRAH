import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import API from '../api/axios';

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/events', label: 'Événements' },
  { to: '/packages', label: 'Forfaits' },
  { to: '/shop', label: 'Boutique' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState('');
  const location = useLocation();

  useEffect(() => {
    API.get('/settings').then(res => setLogo(res.data?.logo || '')).catch(() => {});
  }, []);

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            {logo ? (
              <img src={`/uploads/settings/${logo}`} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
              <span className="text-2xl font-display font-bold bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">Afrah</span>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`text-sm font-medium transition-colors duration-200 relative ${location.pathname === l.to ? 'text-gold-600' : 'text-gray-500 hover:text-gray-900'}`}>
                {l.label}
                {location.pathname === l.to && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gold-400 rounded-full" />
                )}
              </Link>
            ))}
            <Link to="/order" className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
              Réserver
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition" onClick={() => setOpen(!open)} aria-label="Menu">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-1">
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={`block py-2.5 px-4 rounded-lg text-sm ${location.pathname === l.to ? 'text-gold-600 bg-gold-50/50 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                {l.label}
              </Link>
            ))}
            <Link to="/order" onClick={() => setOpen(false)} className="block text-center bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2.5 rounded-full mt-3 transition-all">
              Réserver
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
