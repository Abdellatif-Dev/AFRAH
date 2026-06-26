import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="bg-white shadow-sm px-6 py-3 flex justify-between items-center">
      <div className="md:hidden">
        <span className="text-lg font-display font-bold text-gold-600">Afrah Admin</span>
      </div>
      <div className="flex items-center space-x-4 ml-auto">
        <span className="text-sm text-gray-600">{user?.name}</span>
        <button onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700 transition-colors font-medium">
          Déconnexion
        </button>
      </div>
    </header>
  );
}
