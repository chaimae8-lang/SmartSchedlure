import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  DoorOpen, 
  Zap, 
  Calendar 
} from 'lucide-react';

const menuItems = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/teachers', label: 'Enseignants', icon: Users },
  { to: '/classes', label: 'Classes', icon: BookOpen },
  { to: '/rooms', label: 'Salles', icon: DoorOpen },
  { to: '/generator', label: 'Générateur', icon: Zap },
  { to: '/schedule', label: 'Emploi du temps', icon: Calendar },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white flex flex-col">
      {/* Logo / Header */}
      <div className="px-6 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <div>
            <div className="font-bold text-xl text-gray-900">Smart Scheduler</div>
            <div className="text-xs text-slate-500 -mt-1">AI Timetable Generator</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6">
        <div className="px-3 mb-3 text-xs font-medium text-slate-500 uppercase tracking-widest">
          Menu principal
        </div>
        
        {menuItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mb-1 rounded-2xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 mt-auto">
        <div className="text-xs text-slate-400 text-center">
          © 2026 Smart Scheduler
        </div>
      </div>
    </aside>
  );
}