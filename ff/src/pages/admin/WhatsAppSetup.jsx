import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Smartphone, RefreshCw, Loader2 } from 'lucide-react';
import API from '../../api/axios';

export default function WhatsAppSetup() {
  const [status, setStatus] = useState({ ready: false, hasQr: false });
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminPhone, setAdminPhone] = useState('');
  const polling = useRef(null);

  const fetchQr = async () => {
    try {
      const res = await API.get('/whatsapp/qr');
      if (res.data.qr) {
        setQrData(res.data.qr);
        setStatus(s => ({ ...s, hasQr: true }));
      }
    } catch {}
  };

  const fetchStatus = async () => {
    try {
      const res = await API.get('/whatsapp/status');
      setStatus(res.data);
      if (res.data.ready) {
        setQrData(null);
      } else if (res.data.hasQr) {
        await fetchQr();
      }
    } catch {
      setStatus({ ready: false, hasQr: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    API.get('/settings').then(r => setAdminPhone(r.data?.admin_whatsapp || '')).catch(() => {});
    fetchStatus();
    polling.current = setInterval(fetchStatus, 5000);
    return () => { if (polling.current) clearInterval(polling.current); };
  }, []);

  const handleRestart = async () => {
    try {
      await API.post('/whatsapp/restart');
      toast.success('Redémarrage...');
      setLoading(true);
      setQrData(null);
      setTimeout(async () => {
        await fetchStatus();
        await fetchQr();
      }, 3000);
    } catch {
      toast.error('Échec du redémarrage');
    }
  };

  const handleRetryQr = async () => {
    setLoading(true);
    await fetchQr();
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">WhatsApp</h1>

      <div className="bg-white rounded-xl shadow-md p-8 max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status.ready ? 'bg-green-500' : qrData ? 'bg-amber-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            {status.ready ? '✅ Connecté' : qrData ? '📱 Scanner le QR code' : '❌ Non connecté'}
          </span>
        </div>

        {loading && !qrData && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="animate-spin text-gold-500" size={28} />
            <p className="text-sm text-gray-400">Initialisation du client WhatsApp...</p>
          </div>
        )}

        {qrData && (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">Scannez ce QR code avec WhatsApp sur votre téléphone</p>
            <img src={qrData} alt="WhatsApp QR Code" className="mx-auto w-64 h-64 bg-white p-2 rounded-xl shadow-sm" />
            <p className="text-xs text-gray-400 mt-2">Le QR reste affiché jusqu'à ce que vous scanniez</p>
          </div>
        )}

        {!qrData && !status.ready && !loading && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-4">Aucun QR disponible pour le moment.</p>
            <button onClick={handleRetryQr} className="text-sm text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1.5 mx-auto">
              <RefreshCw size={14} /> Réessayer
            </button>
          </div>
        )}

        {status.ready && (
          <div className="bg-green-50 rounded-xl p-5 text-sm space-y-2">
            <p className="text-green-700 font-medium flex items-center gap-2">✅ WhatsApp connecté</p>
            <p className="text-green-600">Les notifications de nouvelles commandes seront envoyées automatiquement.</p>
          </div>
        )}

        <button onClick={handleRestart} className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2.5 rounded-full transition-all flex items-center justify-center gap-2">
          <RefreshCw size={15} /> Redémarrer le client
        </button>

        <div className="border-t pt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2"><Smartphone size={16} /> Notification de commande produit</h3>
          <p className="text-xs text-gray-500">1. Un message de confirmation est envoyé au <strong>numéro du client</strong>.</p>
          <p className="text-xs text-gray-500">2. Si le client n'a pas WhatsApp, la notification vous est envoyée au <strong>{adminPhone || 'numéro admin (configurez dans Paramètres → WhatsApp)'}</strong>.</p>
        </div>
      </div>
    </div>
  );
}
