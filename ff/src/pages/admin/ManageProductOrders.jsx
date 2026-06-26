import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Search, Check, X, Clock, Trash2, ShoppingCart, PackageCheck, PackageX, PackageSearch, ChevronLeft, ChevronRight, Filter, Eye, Calendar, Phone, MapPin, User } from 'lucide-react';
import API from '../../api/axios';
import ConfirmModal from '../../components/ConfirmModal';

const statusConfig = {
  pending: { 
    style: 'bg-amber-50 text-amber-700 border-amber-200', 
    icon: Clock, 
    label: 'En attente',
    dot: 'bg-amber-400'
  },
  confirmed: { 
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
    icon: Check, 
    label: 'Confirmée',
    dot: 'bg-emerald-400'
  },
  canceled: { 
    style: 'bg-red-50 text-red-700 border-red-200', 
    icon: X, 
    label: 'Annulée',
    dot: 'bg-red-400'
  },
};

export default function ManageProductOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = async (searchTerm = search, status = filterStatus, page = currentPage, perPage = itemsPerPage) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (status) params.append('status', status);
      params.append('page', String(page));
      params.append('per_page', String(perPage));
      const res = await API.get(`/product-orders?${params}`);
      setOrders(res.data.data || res.data);
      setTotalItems(res.data.total || (res.data.data ? res.data.data.length : res.data.length));
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setCurrentPage(1);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => fetchData(val, filterStatus, 1, itemsPerPage), 300));
  };

  const handleStatusFilter = (e) => {
    const val = e.target.value;
    setFilterStatus(val);
    setCurrentPage(1);
    fetchData(search, val, 1, itemsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchData(search, filterStatus, page, itemsPerPage);
  };

  const handleItemsPerPageChange = (e) => {
    const val = parseInt(e.target.value);
    setItemsPerPage(val);
    setCurrentPage(1);
    fetchData(search, filterStatus, 1, val);
  };

  const updateStatus = async (id, status) => {
    try { 
      await API.put(`/product-orders/${id}`, { status }); 
      toast.success('Statut mis à jour'); 
      fetchData(); 
    }
    catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { 
      await API.delete(`/product-orders/${deleteTarget}`); 
      toast.success('Supprimée'); 
      const newTotal = totalItems - 1;
      const maxPage = Math.ceil(newTotal / itemsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
        fetchData(search, filterStatus, maxPage, itemsPerPage);
      } else {
        fetchData();
      }
      setDeleteTarget(null); 
    }
    catch { toast.error('Erreur'); }
    finally { setDeleting(false); }
  };

  // Stats
  const stats = {
    total: totalItems,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    canceled: orders.filter(o => o.status === 'canceled').length,
  };

  // Pagination calc
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl shadow-lg shadow-gold-400/20">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Commandes de produits</h1>
            <p className="text-sm text-gray-500">Gérez et suivez les commandes de vos clients</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
            <PackageSearch className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-xs text-gray-500">En attente</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
            <p className="text-xs text-gray-500">Confirmées</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <PackageX className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.canceled}</p>
            <p className="text-xs text-gray-500">Annulées</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Rechercher</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={search} 
                onChange={handleSearchChange}
                placeholder="Nom, téléphone, produit..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Statut</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                value={filterStatus} 
                onChange={handleStatusFilter}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all appearance-none"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="canceled">Annulée</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium">Aucune commande trouvée</p>
          <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres de recherche</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-500">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Client</th>
                  <th className="px-6 py-3.5 font-medium">Produit</th>
                  <th className="px-6 py-3.5 font-medium hidden md:table-cell">Date</th>
                  <th className="px-6 py-3.5 font-medium">Statut</th>
                  <th className="px-6 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => {
                  const cfg = statusConfig[o.status] || statusConfig.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-100 to-gold-200 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gold-700" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{o.customer_name}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Phone size={10} /> {o.phone}
                            </p>
                            {o.address && (
                              <p className="text-xs text-gray-300 mt-0.5 flex items-center gap-1">
                                <MapPin size={10} /> {o.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-800">{o.product_title || '—'}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-500 flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-400" />
                          {o.created_at?.slice(0, 10)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${cfg.style}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                          <StatusIcon size={12} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setSelectedOrder(o)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                            title="Voir détails"
                          >
                            <Eye size={15} />
                          </button>
                          {o.status !== 'confirmed' && (
                            <button 
                              onClick={() => updateStatus(o.id, 'confirmed')}
                              className="flex items-center gap-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium px-3 py-1.5 rounded-lg transition-all"
                            >
                              <Check size={12} /> Confirmer
                            </button>
                          )}
                          {o.status !== 'canceled' && (
                            <button 
                              onClick={() => updateStatus(o.id, 'canceled')}
                              className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium px-3 py-1.5 rounded-lg transition-all"
                            >
                              <X size={12} /> Annuler
                            </button>
                          )}
                          <button 
                            onClick={() => setDeleteTarget(o.id)} 
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {orders.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">
                Affichage de <span className="font-semibold text-gray-700">{startItem}</span> à <span className="font-semibold text-gray-700">{endItem}</span> sur <span className="font-semibold text-gray-700">{totalItems}</span> commandes
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Par page:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={handleItemsPerPageChange}
                  className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  <option value={8}>8</option>
                  <option value={16}>16</option>
                  <option value={32}>32</option>
                  <option value={64}>64</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft size={18} />
              </button>

              {getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`min-w-[36px] h-9 px-3 rounded-xl text-sm font-medium transition-all ${
                    currentPage === page 
                      ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg shadow-gray-900/20' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-display font-bold text-gray-900">Détails de la commande</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-100 to-gold-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gold-700" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{selectedOrder.customer_name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone size={10} /> {selectedOrder.phone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Produit</p>
                  <p className="text-sm font-medium text-gray-900">{selectedOrder.product_title || '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Calendar size={12} className="text-gray-400" />
                    {selectedOrder.created_at?.slice(0, 10)}
                  </p>
                </div>
              </div>

              {selectedOrder.address && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Adresse</p>
                  <p className="text-sm text-gray-800 flex items-start gap-1.5">
                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    {selectedOrder.address}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500">Statut</span>
                {(() => {
                  const cfg = statusConfig[selectedOrder.status] || statusConfig.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${cfg.style}`}>
                      <StatusIcon size={12} /> {cfg.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
              {selectedOrder.status !== 'confirmed' && (
                <button 
                  onClick={() => { updateStatus(selectedOrder.id, 'confirmed'); setSelectedOrder(null); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-xl transition-all"
                >
                  <Check size={14} /> Confirmer
                </button>
              )}
              {selectedOrder.status !== 'canceled' && (
                <button 
                  onClick={() => { updateStatus(selectedOrder.id, 'canceled'); setSelectedOrder(null); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-all"
                >
                  <X size={14} /> Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        open={!!deleteTarget} 
        title="Supprimer la commande"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer cette commande ?"
        onConfirm={handleDelete} 
        onCancel={() => setDeleteTarget(null)} 
        loading={deleting} 
      />
    </div>
  );
}