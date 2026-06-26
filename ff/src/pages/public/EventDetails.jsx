import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [heroError, setHeroError] = useState(false);

  useEffect(() => {
    API.get(`/events/${id}`)
      .then(res => setEvent(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (lightbox !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightbox]);
console.log(event);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!event) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className="text-gray-500">Événement introuvable.</p>
    </div>
  );

  const allMedia = event.media || [];
  const images = allMedia.filter(m => m.type !== 'video');
  const videos = allMedia.filter(m => m.type === 'video');

  const handleImgError = (idx) => {
    setImageErrors(prev => ({ ...prev, [idx]: true }));
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        <Link to="/events" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gold-600 transition-colors mb-6 sm:mb-8 group">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            {event.image && !heroError ? (
              <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                <img src={`/uploads/events/${event.image}`} alt={event.title}
                  onError={() => setHeroError(true)}
                  className="w-full h-auto object-cover" />
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-amber-900 via-stone-800 to-rose-900 aspect-[4/3] flex items-center justify-center">
                <span className="text-8xl sm:text-9xl font-display text-white/10 select-none">{event.title[0]}</span>
              </div>
            )}

            {images.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Galerie</h2>
                <div className="columns-2 sm:columns-3 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
                  {images.map((m, i) => (
                    <button key={i} onClick={() => setLightbox(i)}
                      className="break-inside-avoid rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gold-500 w-full">
                      {imageErrors[i] ? (
                        <div className="w-full aspect-[3/4] bg-gradient-to-br from-stone-700 via-stone-800 to-amber-900 flex items-center justify-center">
                          <span className="text-4xl font-display text-white/10">{event.title[0]}</span>
                        </div>
                      ) : (
                        <img src={`/uploads/events/${m.file_name}`} alt=""
                          onError={() => handleImgError(i)}
                          className="w-full h-auto object-cover"
                          loading="lazy" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {videos.length > 0 && (
              <div className="mt-8 sm:mt-10">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Vidéos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.map((v, i) => (
                    <div key={i} className="rounded-xl overflow-hidden shadow-md bg-black">
                      <video controls className="w-full aspect-video object-cover"
                        src={`/uploads/videos/${v.file_name}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 leading-tight">{event.title}</h1>
                {event.category_title && (
                  <p className="text-xs text-gold-600 uppercase tracking-wider mt-2">{event.category_title}</p>
                )}
                <div className="w-12 h-0.5 bg-gold-500 mt-4 rounded-full" />
              </div>

              {event.address && (
                <div className="flex items-start gap-3 text-sm text-gray-500">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.address}</span>
                </div>
              )}

              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{event.description}</p>

              <div className="flex flex-col gap-3 pt-2">
                <Link to={`/order?category=${event.category_id}`} className="btn-primary text-center text-sm">
                  Réserver cet événement
                </Link>
                <Link to="/packages" className="btn-secondary text-center text-sm">
                  Voir les forfaits
                </Link>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {allMedia.length} média{allMedia.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightbox !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button onClick={(e) => { e.stopPropagation(); setLightbox(prev => prev > 0 ? prev - 1 : images.length - 1); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button onClick={(e) => { e.stopPropagation(); setLightbox(prev => prev < images.length - 1 ? prev + 1 : 0); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 text-white/50 text-xs">
            {lightbox + 1} / {images.length}
          </div>

          <img src={`/uploads/events/${images[lightbox]?.file_name}`} alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
