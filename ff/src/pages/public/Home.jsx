import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import PackageCard from '../../components/PackageCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const CAROUSEL_VISIBLE = 4; // max items visible f screen
const CAROUSEL_MAX = 8;     // max items f rotation pool

function prepareCarousel(items = []) {
  if (items.length <= CAROUSEL_VISIBLE) {
    return { items, rotate: false };
  }
  return { items: items.slice(0, CAROUSEL_MAX), rotate: true };
}

// duration kif kbra l-liste, ymchi b lentitude tabt
function carouselDuration(count) {
  return `${Math.max(18, count * 4)}s`;
}

// ===== Mobile: pack b pack, kol pack yb9a INTERVAL_MS w 3andha les boutons </> =====
function PackSlideshow({ items, intervalMs = 5000 }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIdx(prev => (prev + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, intervalMs, idx]);

  if (items.length === 0) return null;

  const goPrev = () => setIdx(prev => (prev - 1 + items.length) % items.length);
  const goNext = () => setIdx(prev => (prev + 1) % items.length);

  return (
    <div className="relative px-4">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {items.map((pkg, i) => (
            <div key={`${pkg.id}-${i}`} className="w-full flex-shrink-0 px-1">
              <PackageCard pkg={pkg} />
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Précédent"
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full p-2 text-gray-700 hover:text-gold-600 z-10"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goNext}
            aria-label="Suivant"
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full p-2 text-gray-700 hover:text-gold-600 z-10"
          >
            <ChevronRight size={18} />
          </button>

          <div className="flex justify-center gap-1.5 mt-4">
            {items.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-gold-400 w-5' : 'bg-gray-300 w-1.5'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [packages, setPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [pkgFilter, setPkgFilter] = useState('');

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [slides]);

  useEffect(() => {
    Promise.all([
      API.get('/slides'),
      API.get('/categories'),
      API.get('/packages'),
      API.get('/products'),
    ]).then(([slRes, catRes, pkgRes, prRes]) => {
      setSlides(slRes.data);

      // ✅ normalize: trim + lowercase + collapse multi-word spacing (\s+ → space wahda)
      const normalizeTitle = (title) =>
        (title || '').trim().toLowerCase().replace(/\s+/g, ' ');

      const seenTitles = new Set();
      const uniqueCats = catRes.data.filter(c => {
        const key = normalizeTitle(c.title);
        if (!key || seenTitles.has(key)) return false;
        seenTitles.add(key);
        return true;
      });
      setCategories(uniqueCats);

      setPackages(pkgRes.data);
      setProducts(prRes.data);
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  // ===== Packages: nfiltro mn qbl ndiro carousel =====
  let displayedPackages = packages;
  if (pkgFilter) {
    displayedPackages = packages.filter(p => String(p.category_id) === pkgFilter);
  } else {
    const seen = new Set();
    displayedPackages = [];
    packages.forEach(p => {
      const key = p.category_id || 'null';
      if (!seen.has(key)) { seen.add(key); displayedPackages.push(p); }
    });
  }

  // ===== Pack Mariage: carousel mkhasas ghir l categorie "Mariage" =====
  const mariageCategoryIds = categories
    .filter(c => (c.title || '').toLowerCase().includes('mariage'))
    .map(c => c.id);
  const mariagePackages = packages.filter(p => mariageCategoryIds.includes(p.category_id));

  const catCarousel = prepareCarousel(categories);
  const prodCarousel = prepareCarousel(products);
  const pkgCarousel = prepareCarousel(displayedPackages);
  const mariageCarousel = prepareCarousel(mariagePackages);

  // classe commune l item width (4 visibles f desktop, 3 f tablet, 2 f mobile)
  const ITEM_WIDTH = 'flex-shrink-0 w-[78%] sm:w-[47%] md:w-[31%] lg:w-[23%]';

  return (
    <div>
      <style>{`
        @keyframes infiniteCarousel {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <section className="relative h-[80vh] sm:h-[90vh] overflow-hidden">
        {slides.map((slide, i) => (
          <div key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ${i === slideIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
            <picture>
              <source media="(max-width: 768px)" srcSet={`/uploads/slides/${slide.image_mobile}`} />
              <img src={`/uploads/slides/${slide.image}`} alt=""
                className="w-full h-full object-cover"
                fetchpriority={i === 0 ? 'high' : 'low'} />
            </picture>
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setSlideIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === slideIndex ? 'bg-gold-400 w-8' : 'bg-white/30 hover:bg-white/50 w-2'}`} />
          ))}
        </div>
      </section>

      {/* ========== PACK MARIAGE (carousel mkhasas, taht hero) ========== */}
      {mariageCarousel.items.length > 0 && (
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-14">
              <span className="text-xs font-semibold text-gold-600 uppercase tracking-[0.2em]">Tarifs</span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-3">Nos Forfaits Mariage</h2>
              <div className="w-10 h-0.5 bg-gold-400 mx-auto mt-4 rounded-full" />
              <p className="text-sm text-gray-400 mt-3">Nos meilleures offres pour votre grand jour</p>
            </div>

            <div className="sm:hidden">
              <PackSlideshow items={mariageCarousel.items} />
            </div>

            <div className="hidden sm:block relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
              <div
                className={`flex gap-6 px-4 sm:px-6 lg:px-8 ${mariageCarousel.rotate ? 'carousel-track' : 'flex-wrap justify-center'}`}
                style={mariageCarousel.rotate ? { animation: `infiniteCarousel ${carouselDuration(mariageCarousel.items.length)} linear infinite` } : undefined}
              >
                {(mariageCarousel.rotate ? mariageCarousel.items.concat(mariageCarousel.items) : mariageCarousel.items).map((pkg, i) => (
                  <div key={`mariage-${pkg.id}-${i}`} className={ITEM_WIDTH}>
                    <PackageCard pkg={pkg} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-20 sm:py-28 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ========== CATEGORIES ========== */}
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-semibold text-gold-600 uppercase tracking-[0.2em]">Portfolio</span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-3">Nos Réalisations</h2>
            <div className="w-10 h-0.5 bg-gold-400 mx-auto mt-4 rounded-full" />
            <p className="text-sm text-gray-400 mt-3">Découvrez nos catégories d'événements</p>
          </div>

          {categories.length > 0 && (
            <>
              <div className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
                <div
                  className={`flex gap-5 px-4 sm:px-6 lg:px-8 ${catCarousel.rotate ? 'carousel-track' : 'flex-wrap justify-center'}`}
                  style={catCarousel.rotate ? { animation: `infiniteCarousel ${carouselDuration(catCarousel.items.length)} linear infinite` } : undefined}
                >
                  {(catCarousel.rotate ? catCarousel.items.concat(catCarousel.items) : catCarousel.items).map((cat, i) => (
                    <Link
                      key={`${cat.id}-${i}`}
                      to={`/events?category=${cat.id}`}
                      className={`block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group ${ITEM_WIDTH}`}
                    >
                      <div className="h-44 overflow-hidden bg-gradient-to-br from-amber-900 via-stone-800 to-rose-900">
                        {cat.image ? (
                          <img
                            src={`/uploads/categories/${cat.image}`}
                            alt={cat.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl font-display text-white/10 select-none">{cat.title[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-display font-semibold text-gray-900 text-sm group-hover:text-gold-600 transition-colors">{cat.title}</h3>
                        {cat.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{cat.description}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="text-center mt-6 mb-14">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700 transition-colors border-b border-gold-300 hover:border-gold-500 pb-0.5"
                >
                  Voir toutes les catégories
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </>
          )}

          {/* ========== PRODUCTS ========== */}
          {products.length > 0 && (
            <>
              <div className="text-center max-w-xl mx-auto mb-14">
                <span className="text-xs font-semibold text-gold-600 uppercase tracking-[0.2em]">Boutique</span>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-3">Nos Produits</h2>
                <div className="w-10 h-0.5 bg-gold-400 mx-auto mt-4 rounded-full" />
                <p className="text-sm text-gray-400 mt-3">Découvrez notre sélection</p>
              </div>

              <div className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
                <div
                  className={`flex gap-5 px-4 sm:px-6 lg:px-8 ${prodCarousel.rotate ? 'carousel-track' : 'flex-wrap justify-center'}`}
                  style={prodCarousel.rotate ? { animation: `infiniteCarousel ${carouselDuration(prodCarousel.items.length)} linear infinite` } : undefined}
                >
                  {(prodCarousel.rotate ? prodCarousel.items.concat(prodCarousel.items) : prodCarousel.items).map((pr, i) => (
                    <Link
                      key={`${pr.id}-${i}`}
                      to="/shop"
                      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group ${ITEM_WIDTH}`}
                    >
                      <div className="h-44 overflow-hidden">
                        {pr.image ? (
                          <img
                            src={`/uploads/products/${pr.image}`}
                            alt={pr.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex items-center justify-center">
                            <span className="text-4xl font-display text-white/10">{pr.title[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-display font-semibold text-gray-900 text-sm">{pr.title}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-gold-600">{Number(pr.price).toLocaleString()} DH</span>
                          <span className="text-xs text-gray-400 group-hover:text-gold-600 transition-colors">Voir →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="text-center mt-6">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700 transition-colors border-b border-gold-300 hover:border-gold-500 pb-0.5"
                >
                  Voir toute la boutique
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-semibold text-gold-600 uppercase tracking-[0.2em]">Tarifs</span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-3">Nos Forfaits</h2>
            <div className="w-10 h-0.5 bg-gold-400 mx-auto mt-4 rounded-full" />
            <p className="text-sm text-gray-400 mt-3">Découvrez nos forfaits par catégorie</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button onClick={() => setPkgFilter('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!pkgFilter ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
              Tous
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setPkgFilter(String(cat.id))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${pkgFilter === String(cat.id) ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                {cat.title}
              </button>
            ))}
          </div>

          {pkgCarousel.items.length === 0 ? (
            <p className="text-center text-gray-300">Aucun forfait disponible pour le moment.</p>
          ) : (
            <>
              <div className="sm:hidden">
                <PackSlideshow items={pkgCarousel.items} />
              </div>

              <div className="hidden sm:block relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
                <div
                  className={`flex gap-6 px-4 sm:px-6 lg:px-8 ${pkgCarousel.rotate ? 'carousel-track' : 'flex-wrap justify-center'}`}
                  style={pkgCarousel.rotate ? { animation: `infiniteCarousel ${carouselDuration(pkgCarousel.items.length)} linear infinite` } : undefined}
                >
                  {(pkgCarousel.rotate ? pkgCarousel.items.concat(pkgCarousel.items) : pkgCarousel.items).map((pkg, i) => (
                    <div key={`${pkg.id}-${i}`} className={ITEM_WIDTH}>
                      <PackageCard pkg={pkg} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-24 sm:py-32 bg-[#fafafa]">
        <div className="max-w-3xl mx-auto text-center px-4">
          <span className="text-xs font-semibold text-gold-600 uppercase tracking-[0.2em]">Contact</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-3">Prêt à Planifier Votre Événement ?</h2>
          <div className="w-10 h-0.5 bg-gold-400 mx-auto mt-4 rounded-full" />
          <p className="text-sm sm:text-base text-gray-400 mt-4 max-w-md mx-auto">Contactez-nous dès aujourd'hui et réalisons votre célébration de rêve.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/order" className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-8 py-3.5 rounded-full transition-all shadow-sm hover:shadow-md">
              Réserver maintenant
            </Link>
            <Link to="/contact" className="bg-white hover:bg-gray-50 text-gray-900 text-sm font-medium px-8 py-3.5 rounded-full transition-all border border-gray-200 shadow-sm hover:shadow-md">
              Contactez-nous
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}