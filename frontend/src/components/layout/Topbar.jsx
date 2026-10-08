import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Topbar() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shadow-sm">
      {/* Left Side - School Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Année Scolaire 2025-2026</div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <span>Lundi à Samedi</span>
              <span className="text-slate-300">•</span>
              <span>08:00 - 18:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - User & Logout */}
      <div className="flex items-center gap-4">
        {/* User Info */}
        <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-800">Administrateur</div>
            <div className="text-xs text-slate-500">Smart Scheduler</div>
          </div>
          <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-slate-600" />
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-100 hover:border-red-200 rounded-2xl transition-all active:bg-red-100"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </header>
  );
}