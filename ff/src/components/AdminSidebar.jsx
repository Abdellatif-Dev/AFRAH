import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Folder, Calendar, Package, ClipboardList,
  Upload, Settings, MessageSquare, LogOut, ShoppingBag, Tags,
  ShoppingCart, Menu, X, ChevronRight
} from 'lucide-react';

const links = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/admin/categories', label: 'Catégories', icon: Folder },
  { to: '/admin/events', label: 'Événements', icon: Calendar },
  { to: '/admin/packages', label: 'Forfaits', icon: Package },
  { to: '/admin/orders', label: 'Commandes', icon: ClipboardList },
  { to: '/admin/product-categories', label: 'Catég. produits', icon: Tags },
  { to: '/admin/products', label: 'Produits', icon: ShoppingBag },
  { to: '/admin/product-orders', label: 'Cmd. produits', icon: ShoppingCart },
  { to: '/admin/upload', label: 'Médias', icon: Upload },
  { to: '/admin/settings', label: 'Paramètres', icon: Settings },
  { to: '/admin/whatsapp', label: 'WhatsApp', icon: MessageSquare },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* ═══ MOBILE HEADER ═══ */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 font-bold text-xs">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="leading-tight">
              <h2 className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</h2>
              <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 active:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ═══ MOBILE OVERLAY ═══ */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={closeMobile}
        />
      )}

      {/* ═══ SIDEBAR — FIXED/STICKY ═══ */}
      <aside
        className={`
          fixed lg:fixed left-0 top-0 bottom-0 z-50
          w-64 bg-white shadow-lg
          h-screen
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col border-r border-gray-100
        `}
      >
        {/* User Card — Desktop only (mobile f header) */}
        <div className="hidden lg:block p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 font-bold text-sm">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Admin'}</h2>
              <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {links.map(l => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/admin'}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm group ${
                    isActive
                      ? 'bg-gold-50 text-gold-700 font-semibold shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{l.label}</span>
                <ChevronRight
                  size={14}
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-300"
                />
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ═══ SPACER — Pushes content to the right on desktop ═══ */}
      <div className="hidden lg:block w-64 shrink-0" />
    </>
  );
}