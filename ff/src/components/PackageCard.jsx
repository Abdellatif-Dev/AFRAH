import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PackageCard({ pkg }) {
  const [imgError, setImgError] = useState(false);
  console.log(pkg);
  
  const hasImg = pkg.image && !imgError;

  const payItems = (pkg.items || []).filter(i => i.type === 'pay');
  const gratuiteItems = (pkg.items || []).filter(i => i.type === 'gratuite' || !i.type);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 relative flex flex-col border border-gray-50">
      {pkg.title === 'VIP' && (
        <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-gold-500 to-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
          Meilleur choix
        </div>
      )}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-amber-900 via-stone-800 to-rose-900">
        {hasImg ? (
          <img src={`/uploads/packages/${pkg.image}`} alt={pkg.title}
            className="w-full h-full object-cover"
            loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl font-display text-white/10 select-none">{pkg.title[0]}</span>
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-px bg-gold-400" />
          <span className="text-xs text-gray-400 uppercase tracking-wider">Forfait</span>
        </div>
        <h3 className="text-2xl font-display font-bold text-gray-900">{pkg.title}</h3>
        <p className="mt-1 text-sm text-gray-400">{pkg.description}</p>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">{Number(pkg.price).toLocaleString()}</span>
          <span className="text-sm text-gray-400">DH</span>
        </div>

        {payItems.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Options payantes
            </p>
            <ul className="space-y-2">
              {payItems.map((item, i) => (
                <li key={i} className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-amber-400 mr-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
                  </svg>
                  {item.item || item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {gratuiteItems.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Inclus
            </p>
            <ul className="space-y-2">
              {gratuiteItems.map((item, i) => (
                <li key={i} className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-400 mr-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item.item || item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto pt-6">
          <Link to={`/order?category=${pkg.category_id}`}
            className="block text-center bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-3 rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
            Choisir ce pack
          </Link>
        </div>
      </div>
    </div>
  );
}
