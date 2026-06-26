import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../api/axios';

export default function Order() {
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get('category');

  const [categories, setCategories] = useState([]);
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    event_date: '',
    package_id: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get('/categories'),
      API.get('/packages')
    ]).then(([catRes, pkgRes]) => {
      setCategories(catRes.data);
      setPackages(pkgRes.data);
    }).catch(() => {});
  }, []);

  // Filter packages b category_id men URL
  useEffect(() => {
    if (preselectedCategory) {
      setFilteredPackages(packages.filter(p => String(p.category_id) === String(preselectedCategory)));
    } else {
      setFilteredPackages(packages);
    }
  }, [preselectedCategory, packages]);

  const selectedPkg = packages.find(p => String(p.id) === form.package_id) || null;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.phone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!form.event_date) {
      toast.error('Veuillez sélectionner une date');
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/orders', form);
      toast.success('Réservation effectuée avec succès ! Nous vous contacterons bientôt.');
      setForm({ customer_name: '', phone: '', address: '', event_date: '', package_id: '', notes: '' });
    } catch {
      toast.error('Échec de la réservation. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs font-semibold text-gold-600 uppercase tracking-[0.2em]">Réservation</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-3">Réserver Votre Événement</h1>
          <div className="w-10 h-0.5 bg-gold-400 mx-auto mt-4 rounded-full" />
          <p className="text-sm text-gray-400 mt-3">Remplissez le formulaire et nous vous recontacterons</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-50 p-8 sm:p-10 space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet *</label>
                <input name="customer_name" value={form.customer_name} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all placeholder:text-gray-300"
                  placeholder="Votre nom" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone *</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all placeholder:text-gray-300"
                  placeholder="+212 6 XX XX XX XX" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
              <input name="address" value={form.address} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all placeholder:text-gray-300"
                placeholder="Adresse de l'événement" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de l'événement *</label>
                <input name="event_date" type="date" value={form.event_date} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all" min="2020-01-01" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Forfait</label>
                <select name="package_id" value={form.package_id} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all">
                  <option value="">{filteredPackages.length > 0 ? 'Choisir un forfait' : 'Aucun forfait disponible'}</option>
                  {filteredPackages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.title} - {Number(pkg.price).toLocaleString()} DH</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPkg && (selectedPkg.items || []).length > 0 && (
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Détails du forfait : {selectedPkg.title}</h4>
                <div className="space-y-2">
                  {(selectedPkg.items || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {item.type === 'pay' ? (
                        <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span className={item.type === 'pay' ? 'text-amber-700' : 'text-green-700'}>{item.item}</span>
                      <span className={`text-xs ml-auto ${item.type === 'pay' ? 'text-amber-500' : 'text-green-500'}`}>
                        {item.type === 'pay' ? 'Payant' : 'Gratuit'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all placeholder:text-gray-300 resize-none"
                rows={3} placeholder="Demandes spéciales ?" />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium py-3.5 rounded-full transition-all shadow-sm hover:shadow-md">
              {submitting ? 'En cours...' : 'Confirmer la réservation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}