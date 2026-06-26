import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../api/axios';
import PackageCard from '../../components/PackageCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Packages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    Promise.all([
      API.get('/packages'),
      API.get('/categories')
    ]).then(([pkgRes, catRes]) => {
      let pkgs = pkgRes.data;
      console.log(pkgs);
      
      if (activeCategory) pkgs = pkgs.filter(p => String(p.category_id) === activeCategory);
      setPackages(pkgs);
      setCategories(catRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [activeCategory]);

  const handleCategoryClick = (id) => {
    if (activeCategory === String(id)) setSearchParams({});
    else setSearchParams({ category: id });
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="min-h-screen bg-[#fafafa] py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-semibold text-gold-600 uppercase tracking-[0.2em]">Tarifs</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-3">Nos Forfaits</h1>
          <div className="w-10 h-0.5 bg-gold-400 mx-auto mt-4 rounded-full" />
          <p className="text-sm text-gray-400 mt-3">Choisissez le forfait qui correspond à vos besoins</p>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button onClick={() => setSearchParams({})}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!activeCategory ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
              Tous
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => handleCategoryClick(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === String(cat.id) ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                {cat.title}
              </button>
            ))}
          </div>
        )}

        {packages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-300">Aucun forfait disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {packages.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
