import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Search, CheckCircle2, XCircle, Trash2, ChevronLeft, ChevronRight,
  Phone, Calendar, Package, User, ClipboardList, Clock, MoreHorizontal,
  MapPin, MessageSquare, AlertCircle
} from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';

// ✅ Ghir 4 status: pending | avance | canceled | termini
const statusConfig = {
  pending: {
    label: 'En attente',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Clock,
    dot: 'bg-amber-500',
  },
  avance: {
    label: 'Avance',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: CheckCircle2,
    dot: 'bg-blue-500',
  },
  termini: {
    label: 'Terminée',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: CheckCircle2,
    dot: 'bg-indigo-500',
  },
  canceled: {
    label: 'Annulée',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: XCircle,
    dot: 'bg-rose-500',
  },
};

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Status filter
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Confirm modals
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'avance'|'canceled'|'termini'|'delete', orderId, orderName }
  const [processing, setProcessing] = useState(false);
  const [advancePrice, setAdvancePrice] = useState('');

  const fetchOrders = (searchTerm = search, pageNum = page, filterStatus = statusFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), page: String(pageNum) });
    if (searchTerm) params.append('search', searchTerm);
    if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
    API.get(`/orders?${params}`)
      .then(res => {
        setOrders(res.data.orders || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => {
      setPage(1);
      fetchOrders(val, 1, statusFilter);
    }, 300));
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchOrders(search, newPage, statusFilter);
  };

  const updateStatus = async (id, status) => {
    setProcessing(true);
    try {
      const body = { status };
      if (status === 'avance') body.advance_price = parseFloat(advancePrice) || 0;
      await API.put(`/orders/${id}`, body);
      toast.success(`Réservation ${statusConfig[status].label.toLowerCase()}`);
      fetchOrders();
      setConfirmAction(null);
      setAdvancePrice('');
    } catch {
      toast.error('Erreur de mise à jour');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    setProcessing(true);
    try {
      await API.delete(`/orders/${id}`);
      toast.success('Réservation supprimée');
      fetchOrders();
      setConfirmAction(null);
    } catch {
      toast.error('Erreur de suppression');
    } finally {
      setProcessing(false);
    }
  };

  const executeConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete') {
      handleDelete(confirmAction.orderId);
    } else {
      updateStatus(confirmAction.orderId, confirmAction.type);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getConfirmMessage = () => {
    if (!confirmAction) return {};
    const name = confirmAction.orderName;
    switch (confirmAction.type) {
      case 'avance':
        return { title: 'Marquer avance', message: `Voulez-vous marquer la réservation de ${name} comme "Avance" ? Un événement sera ajouté au calendrier Google et un message WhatsApp sera envoyé au client.` };
      case 'termini':
        return { title: 'Terminer', message: `Voulez-vous marquer la réservation de ${name} comme "Terminée" ?` };
      case 'canceled':
        return { title: 'Annuler la réservation', message: `Voulez-vous annuler la réservation de ${name} ? Un message WhatsApp sera envoyé au client.` };
      case 'delete':
        return { title: 'Supprimer la réservation', message: `Cette action est irréversible. Voulez-vous vraiment supprimer la réservation de ${name} ?` };
      default:
        return {};
    }
  };

  if (loading && orders.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Réservations</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} réservation{total !== 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status summary mini badges */}
          <div className="hidden sm:flex items-center gap-2">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <span key={key} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ SEARCH ═══ */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Rechercher par nom client ou téléphone..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all"
        />
      </div>

      {/* ═══ STATUS FILTER TABS ═══ */}
      <div className="flex flex-wrap gap-1.5">
        {[{ key: 'all', label: 'Tous' }, ...Object.entries(statusConfig).map(([key, cfg]) => ({ key, label: cfg.label }))].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleFilterChange(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === key
                ? key === 'all' ? 'bg-gray-900 text-white shadow-sm' : `${statusConfig[key].bg} ${statusConfig[key].text} border ${statusConfig[key].border}`
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══ DESKTOP TABLE ═══ */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Client</th>
              <th className="px-6 py-3.5">Contact</th>
              <th className="px-6 py-3.5">Forfait</th>
              <th className="px-6 py-3.5">Date événement</th>
              <th className="px-6 py-3.5">Statut</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList size={40} className="text-gray-200" />
                    <p className="text-gray-400 text-sm">Aucune réservation trouvée</p>
                  </div>
                </td>
              </tr>
            ) : orders.map(order => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <tr key={order.id} className="group hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                        {order.customer_name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{order.customer_name}</div>
                    {order.notes && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MessageSquare size={10} className="text-gray-300" />
                        <span className="text-[10px] text-gray-400 line-clamp-1 max-w-[200px]">{order.notes}</span>
                      </div>
                    )}
                    {order.advance_price > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-[10px] text-blue-600 font-semibold">{order.advance_price} MAD</span>
                      </div>
                    )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Phone size={13} className="text-gray-300" />
                      {order.phone}
                    </div>
                    {order.address && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <MapPin size={11} className="text-gray-300" />
                        <span className="truncate max-w-[140px]">{order.address}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Package size={13} className="text-gray-300 shrink-0" />
                      <span className="truncate max-w-[150px] font-semibold text-gray-800">
                        {order.package_title || (order.custom_items ? 'Forfait Personnalisé 🛠️' : '—')}
                      </span>
                    </div>
                    {order.custom_items && (
                      <div className="text-[10px] text-amber-600 mt-1 max-w-[180px] truncate" title={order.custom_items}>
                        {order.custom_items}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar size={13} className="text-gray-300" />
                      {order.event_date || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${status.bg} ${status.text} ${status.border}`}>
                      <StatusIcon size={13} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => { setAdvancePrice(''); setConfirmAction({ type: 'avance', orderId: order.id, orderName: order.customer_name }); }}
                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-600 transition-colors"
                            title="Avance"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'canceled', orderId: order.id, orderName: order.customer_name })}
                            className="p-2 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors"
                            title="Annuler"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {order.status === 'avance' && (
                        <>
                          <button
                            onClick={() => setConfirmAction({ type: 'termini', orderId: order.id, orderName: order.customer_name })}
                            className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-500 hover:text-indigo-600 transition-colors"
                            title="Terminée"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'canceled', orderId: order.id, orderName: order.customer_name })}
                            className="p-2 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors"
                            title="Annuler"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {['termini', 'canceled'].includes(order.status) && (
                        <button disabled className="p-2 rounded-lg text-gray-300" title="Aucune action">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmAction({ type: 'delete', orderId: order.id, orderName: order.customer_name })}
                        className="p-2 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══ MOBILE CARDS ═══ */}
      <div className="md:hidden space-y-3">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <ClipboardList size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune réservation trouvée</p>
          </div>
        ) : orders.map(order => {
          const status = statusConfig[order.status] || statusConfig.pending;
          const StatusIcon = status.icon;
          return (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-sm font-bold uppercase shrink-0">
                    {order.customer_name?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{order.customer_name}</h3>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                      <Phone size={11} />
                      {order.phone}
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${status.bg} ${status.text} ${status.border} shrink-0`}>
                  <StatusIcon size={10} />
                  {status.label}
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                {(order.package_title || order.custom_items) && (
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <Package size={12} className="text-gray-300 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-800">
                        {order.package_title || 'Forfait Personnalisé 🛠️'}
                      </span>
                      {order.custom_items && (
                        <div className="text-[10px] text-amber-600 mt-0.5 break-words">
                          {order.custom_items}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {order.event_date && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={12} className="text-gray-300" />
                    <span>{order.event_date}</span>
                  </div>
                )}
                {order.address && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={12} className="text-gray-300" />
                    <span className="truncate">{order.address}</span>
                  </div>
                )}
                {order.notes && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MessageSquare size={12} className="text-gray-300" />
                    <span className="truncate">{order.notes}</span>
                  </div>
                )}
                {order.advance_price > 0 && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {order.advance_price} MAD
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => { setAdvancePrice(''); setConfirmAction({ type: 'avance', orderId: order.id, orderName: order.customer_name }); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Avance
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'canceled', orderId: order.id, orderName: order.customer_name })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-50 text-rose-500 text-xs font-medium hover:bg-rose-100 transition-colors"
                    >
                      <XCircle size={13} /> Annuler
                    </button>
                  </>
                )}
                {order.status === 'avance' && (
                  <>
                    <button
                      onClick={() => setConfirmAction({ type: 'termini', orderId: order.id, orderName: order.customer_name })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Terminer
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'canceled', orderId: order.id, orderName: order.customer_name })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-50 text-rose-500 text-xs font-medium hover:bg-rose-100 transition-colors"
                    >
                      <XCircle size={13} /> Annuler
                    </button>
                  </>
                )}
                {['termini', 'canceled'].includes(order.status) && (
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 text-gray-400 text-xs font-medium">
                    Aucune action
                  </div>
                )}
                <button
                  onClick={() => setConfirmAction({ type: 'delete', orderId: order.id, orderName: order.customer_name })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-50 text-rose-500 text-xs font-medium hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={13} /> Supprimer
                </button>
              </div>
            </div>
          );
        })}
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
                  p === page ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
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

      {/* ═══ CONFIRM MODAL ═══ */}
      <ConfirmModal
        open={!!confirmAction}
        title={getConfirmMessage().title}
        message={getConfirmMessage().message}
        onConfirm={executeConfirm}
        onCancel={() => { setConfirmAction(null); setAdvancePrice(''); }}
        loading={processing}
        confirmLabel={confirmAction?.type === 'avance' ? 'Enregistrer' : confirmAction?.type === 'delete' ? 'Supprimer' : 'Confirmer'}
      >
        {confirmAction?.type === 'avance' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Montant de l'avance (MAD)</label>
            <input
              type="number"
              value={advancePrice}
              onChange={e => setAdvancePrice(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              autoFocus
            />
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}