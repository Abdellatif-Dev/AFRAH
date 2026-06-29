import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

// ─── Simple inline SVG Donut Chart ───
function DonutChart({ data, colors, size = 120, stroke = 14 }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={(size/2)-stroke} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      </svg>
    );
  }
  const r = (size / 2) - stroke;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      {data.map((d, i) => {
        const dash = (d.value / total) * c;
        const seg = (
          <circle
            key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={colors[i % colors.length]}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
          />
        );
        offset += dash;
        return seg;
      })}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-800 text-sm font-bold transform rotate-90">
        {total}
      </text>
    </svg>
  );
}

// ─── Simple Bar Chart ───
function BarChart({ data, color = '#667eea', height = 120 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = 100 / data.length;
  return (
    <svg viewBox={`0 0 ${data.length * 40} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      {data.map((d, i) => (
        <g key={i}>
          <rect
            x={i * 40 + 8}
            y={height - (d.value / max) * (height - 24)}
            width={24}
            height={(d.value / max) * (height - 24)}
            rx={4}
            fill={color}
            opacity={0.85}
          />
          <text
            x={i * 40 + 20}
            y={height - 4}
            textAnchor="middle"
            className="fill-gray-500 text-[10px]"
          >{d.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Status Badge ───
function StatusBadge({ status }) {
  const map = {
    pending:   { bg: 'bg-amber-50', text: 'text-amber-700', label: 'En attente' },
    avance:    { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Avance' },
    confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Confirmée' },
    kamel:     { bg: 'bg-green-50', text: 'text-green-700', label: 'Payé (Kamel)' },
    termini:   { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Terminée' },
    canceled:  { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Annulée' },
    accepte:   { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Acceptée' },
    refuse:    { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Refusée' },
  };
  const s = map[status] || map.pending;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    events: 0, packages: 0, orders: 0, productOrders: 0,
    products: 0, contacts: 0, categories: 0, productCategories: 0,
  });
  const [orderStatus, setOrderStatus] = useState({ pending: 0, avance: 0, confirmed: 0, kamel: 0, termini: 0, canceled: 0 });
  const [productOrderStatus, setProductOrderStatus] = useState({ pending: 0, accepte: 0, refuse: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentProductOrders, setRecentProductOrders] = useState([]);
  const [recentContacts, setRecentContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1. Stats
        const [ev, pkg, ord, pOrd, prod, con, cat, pCat] = await Promise.all([
          API.get('/events?limit=1'),
          API.get('/packages'),
          API.get('/orders?limit=1'),
          API.get('/product-orders'),
          API.get('/products'),
          API.get('/contacts'),
          API.get('/categories'),
          API.get('/product-categories'),
        ]);

        setStats({
          events: ev.data.total || ev.data.events?.length || 0,
          packages: pkg.data.length || 0,
          orders: ord.data.total || ord.data.orders?.length || 0,
          productOrders: pOrd.data.length || 0,
          products: prod.data.length || 0,
          contacts: con.data.length || 0,
          categories: cat.data.length || 0,
          productCategories: pCat.data.length || 0,
        });

        // 2. Order statuses
        const allOrders = ord.data.orders || [];
        const allProductOrders = pOrd.data || [];

        const countStatus = (arr, statuses) => {
          const result = {};
          statuses.forEach(s => result[s] = 0);
          arr.forEach(o => { if (statuses.includes(o.status)) result[o.status]++; });
          return result;
        };

        setOrderStatus(countStatus(allOrders, ['pending', 'avance', 'confirmed', 'kamel', 'termini', 'canceled']));
        setProductOrderStatus(countStatus(allProductOrders, ['pending', 'accepte', 'refuse']));

        // 3. Recent items (last 5)
        setRecentOrders((ord.data.orders || []).slice(0, 5));
        setRecentProductOrders(allProductOrders.slice(0, 5));
        setRecentContacts((con.data || []).slice(0, 5));
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ─── Stat Cards Config ───
  const statCards = [
    {
      label: 'Événements',
      value: stats.events,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      color: 'bg-rose-500',
      light: 'bg-rose-50',
      text: 'text-rose-600',
      to: '/admin/events',
    },
    {
      label: 'Forfaits',
      value: stats.packages,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      color: 'bg-amber-500',
      light: 'bg-amber-50',
      text: 'text-amber-600',
      to: '/admin/packages',
    },
    {
      label: 'Réservations',
      value: stats.orders,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      color: 'bg-blue-500',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      to: '/admin/orders',
    },
    {
      label: 'Commandes Produits',
      value: stats.productOrders,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      color: 'bg-violet-500',
      light: 'bg-violet-50',
      text: 'text-violet-600',
      to: '/admin/product-orders',
    },
    {
      label: 'Produits',
      value: stats.products,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      ),
      color: 'bg-emerald-500',
      light: 'bg-emerald-50',
      text: 'text-emerald-600',
      to: '/admin/products',
    },
    {
      label: 'Messages',
      value: stats.contacts,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
      color: 'bg-teal-500',
      light: 'bg-teal-50',
      text: 'text-teal-600',
      to: '/admin/contacts',
    },
  ];

  const orderDonutData = [
    { value: orderStatus.pending, label: 'En attente' },
    { value: orderStatus.avance, label: 'Avance' },
    { value: orderStatus.confirmed, label: 'Confirmées' },
    { value: orderStatus.kamel, label: 'Payé' },
    { value: orderStatus.termini, label: 'Terminées' },
    { value: orderStatus.canceled, label: 'Annulées' },
  ];

  const productDonutData = [
    { value: productOrderStatus.pending, label: 'En attente' },
    { value: productOrderStatus.accepte, label: 'Acceptées' },
    { value: productOrderStatus.refuse, label: 'Refusées' },
  ];

  const donutColors = ['#f59e0b', '#3b82f6', '#10b981', '#22c55e', '#6366f1', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de votre activité</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${c.light} ${c.text} mb-3 group-hover:scale-110 transition-transform`}>
              {c.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{c.value}</div>
            <div className="text-gray-500 text-xs mt-0.5">{c.label}</div>
          </Link>
        ))}
      </div>

      {/* ─── Charts & Activity Row ─── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Package Orders Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Réservations — Statuts</h3>
          <p className="text-xs text-gray-400 mb-4">Répartition des réservations forfaits</p>
          <div className="flex items-center gap-6">
            <DonutChart data={orderDonutData} colors={donutColors} size={130} stroke={16} />
            <div className="space-y-2 text-sm">
              {orderDonutData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: donutColors[i] }} />
                  <span className="text-gray-600">{d.label}</span>
                  <span className="font-semibold text-gray-900 ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Orders Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Commandes Produits — Statuts</h3>
          <p className="text-xs text-gray-400 mb-4">Répartition des commandes produits</p>
          <div className="flex items-center gap-6">
            <DonutChart data={productDonutData} colors={donutColors} size={130} stroke={16} />
            <div className="space-y-2 text-sm">
              {productDonutData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: donutColors[i] }} />
                  <span className="text-gray-600">{d.label}</span>
                  <span className="font-semibold text-gray-900 ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Résumé rapide</h3>
          <p className="text-xs text-gray-400 mb-4">Indicateurs clés du jour</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-bold">
                  {stats.events}
                </div>
                <span className="text-sm text-gray-700">Événements actifs</span>
              </div>
              <Link to="/admin/events" className="text-rose-600 text-xs font-medium hover:underline">Voir →</Link>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                  {stats.orders}
                </div>
                <span className="text-sm text-gray-700">Réservations totales</span>
              </div>
              <Link to="/admin/orders" className="text-blue-600 text-xs font-medium hover:underline">Voir →</Link>
            </div>
            <div className="flex items-center justify-between p-3 bg-violet-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-bold">
                  {stats.productOrders}
                </div>
                <span className="text-sm text-gray-700">Commandes produits</span>
              </div>
              <Link to="/admin/product-orders" className="text-violet-600 text-xs font-medium hover:underline">Voir →</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Recent Activity Row ─── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Package Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Dernières réservations</h3>
              <p className="text-xs text-gray-400">Forfaits & événements</p>
            </div>
            <Link to="/admin/orders" className="text-xs text-blue-600 font-medium hover:underline">Tout voir</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">Aucune réservation pour le moment</div>
            ) : (
              recentOrders.map((o) => (
                <div key={o.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold uppercase">
                      {o.customer_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{o.customer_name}</div>
                      <div className="text-xs text-gray-400">{o.phone} · {o.package_title || 'Sans forfait'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <span className="text-xs text-gray-400">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Product Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Dernières commandes produits</h3>
              <p className="text-xs text-gray-400">Boutique en ligne</p>
            </div>
            <Link to="/admin/product-orders" className="text-xs text-violet-600 font-medium hover:underline">Tout voir</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentProductOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">Aucune commande pour le moment</div>
            ) : (
              recentProductOrders.map((o) => (
                <div key={o.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-50 text-violet-500 flex items-center justify-center text-xs font-bold uppercase">
                      {o.customer_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{o.customer_name}</div>
                      <div className="text-xs text-gray-400">{o.phone} · {o.product_title || 'Produit'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <span className="text-xs text-gray-400">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Recent Contacts ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Messages récents</h3>
            <p className="text-xs text-gray-400">Contacts clients</p>
          </div>
          <Link to="/admin/contacts" className="text-xs text-teal-600 font-medium hover:underline">Tout voir</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentContacts.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">Aucun message pour le moment</div>
          ) : (
            recentContacts.map((c) => (
              <div key={c.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center text-xs font-bold uppercase">
                    {c.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-400 max-w-md truncate">{c.message}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Quick Actions ─── */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Accès rapide</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { to: '/admin/events', title: 'Gérer les événements', desc: 'Ajouter, modifier ou supprimer', color: 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100' },
            { to: '/admin/packages', title: 'Gérer les forfaits', desc: 'Forfaits mariage & événements', color: 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100' },
            { to: '/admin/orders', title: 'Voir les réservations', desc: 'Gérer les réservations clients', color: 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100' },
            { to: '/admin/products', title: 'Gérer les produits', desc: 'Boutique & catégories', color: 'bg-violet-50 border-violet-100 text-violet-700 hover:bg-violet-100' },
          ].map((a) => (
            <Link key={a.to} to={a.to} className={`rounded-xl border p-5 transition-colors ${a.color}`}>
              <h4 className="font-semibold">{a.title}</h4>
              <p className="text-sm opacity-80 mt-1">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}