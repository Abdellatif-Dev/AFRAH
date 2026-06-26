import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function EventCard({ event }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link to={`/events/${event.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
      <div className="h-48 overflow-hidden bg-gradient-to-br from-amber-900 via-stone-800 to-rose-900">
        {event.image && !imgError ? (
          <img src={`/uploads/events/${event.image}`} alt={event.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl font-display text-white/10 select-none">{event.title[0]}</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-display font-semibold text-gray-900 group-hover:text-gold-600 transition-colors">{event.title}</h3>
        {event.category_title && (
          <p className="text-xs text-gold-600 uppercase tracking-wider mt-1">{event.category_title}</p>
        )}
        {event.address && (
          <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.address}
          </p>
        )}
      </div>
    </Link>
  );
}
