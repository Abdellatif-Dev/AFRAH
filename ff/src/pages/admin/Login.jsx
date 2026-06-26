import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Bienvenue !');
      navigate('/admin');
    } catch {
      toast.error('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-gold-600">Afrah Admin</h1>
          <p className="text-gray-500 mt-1">Connectez-vous pour gérer votre plateforme</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input-field" placeholder="admin@afrah.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input-field" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          Identifiants par défaut : admin@afrah.com / admin123
        </p>
      </div>
    </div>
  );
}
