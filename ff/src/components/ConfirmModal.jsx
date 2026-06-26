import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = 'Supprimer', loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-display font-semibold text-gray-900">{title || 'Confirmer'}</h3>
            <p className="text-sm text-gray-500 mt-1">{message || 'Voulez-vous continuer ?'}</p>
          </div>
          <button onClick={onCancel} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
