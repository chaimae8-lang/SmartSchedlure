import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Users, BookOpen, DoorOpen, BookText } from 'lucide-react';
import { getTeachers } from '../api/teachers';
import { listClasses, listRooms, listSubjects } from '../api/resources';

const statConfig = [
  {
    label: 'Enseignants',
    key: 'teachers',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    label: 'Classes',
    key: 'classes',
    icon: BookOpen,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    label: 'Salles',
    key: 'rooms',
    icon: DoorOpen,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    label: 'Matières',
    key: 'subjects',
    icon: BookText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    teachers: 0,
    classes: 0,
    rooms: 0,
    subjects: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [teachers, classes, rooms, subjects] = await Promise.all([
        getTeachers(),
        listClasses(),
        listRooms(),
        listSubjects(),
      ]);

      setStats({
        teachers: teachers.length,
        classes: classes.length,
        rooms: rooms.length,
        subjects: subjects.length,
      });
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les statistiques");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statConfig.map(({ label, key, icon: Icon, color, bgColor }) => (
          <div
            key={key}
            className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${bgColor}`}>
                <Icon className={`w-8 h-8 ${color}`} />
              </div>
              {loading && (
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
              )}
            </div>

            <div className="mt-6">
              <div className="text-4xl font-semibold text-gray-900 tracking-tighter">
                {loading ? '—' : stats[key].toLocaleString('fr-FR')}
              </div>
              <div className="text-sm text-gray-500 mt-1 font-medium">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
    </div>
  );
}