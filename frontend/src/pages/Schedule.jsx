import { useEffect, useState, useMemo, useCallback } from 'react';
import { RefreshCw, AlertTriangle, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { listClasses } from '../api/resources';
import { getConflicts, getSchedule } from '../api/schedule';

import { useScheduleStore } from '../store/scheduleStore';

import ClassFilter from '../components/schedule/ClassFilter';
import CalendarView from '../components/schedule/CalendarView';
import ConflictBadge from '../components/schedule/ConflictBadge';
import AIChatPanel from '../components/ai/AIChatPanel';
import ScheduleExportButtons from './ScheduleExportButtons';   // ← Même dossier

function flatten(grouped) {
  return Object.values(grouped || {}).flat();
}

export default function Schedule() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const { 
    schedule, 
    conflicts, 
    selectedSlot, 
    setSchedule, 
    setConflicts, 
    setSelectedSlot 
  } = useScheduleStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduleData, conflictsData] = await Promise.all([
        getSchedule(1),
        getConflicts(1)
      ]);
      setSchedule(scheduleData);
      setConflicts(conflictsData);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [setSchedule, setConflicts]);

  useEffect(() => {
    loadData();
    listClasses().then(setClasses);
  }, [loadData]);

  const slots = useMemo(() => {
    const all = flatten(schedule);
    return filter === 'all' 
      ? all 
      : all.filter((s) => String(s.class_id) === String(filter));
  }, [schedule, filter]);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-5 border-b flex items-center gap-3">
          <Calendar className="w-7 h-7 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Emploi du Temps</h1>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-6">
          {/* Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Filtrer par classe</h3>
            <ClassFilter 
              classes={classes} 
              value={filter} 
              onChange={setFilter} 
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>

            {/* New Export Buttons */}
            <ScheduleExportButtons 
              slots={slots} 
              filter={filter} 
            />
          </div>

          {/* Conflicts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-800">Conflits</div>
              <ConflictBadge active={conflicts.length > 0} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{conflicts.length}</div>
            <p className="text-sm text-gray-500">problème(s) détecté(s)</p>

            {conflicts.length > 0 && (
              <div className="mt-3 text-amber-600 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Vérifiez le panneau IA
              </div>
            )}
          </div>

          {/* Selected Slot */}
          {selectedSlot && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="font-semibold">Créneau sélectionné</div>
                <button 
                  onClick={() => setSelectedSlot(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-gray-600">
                <div><span className="text-gray-500">Matière:</span> <span className="font-medium">{selectedSlot.subject?.name || selectedSlot.subject_id}</span></div>
                <div><span className="text-gray-500">Classe:</span> <span className="font-medium">{selectedSlot.class_name || selectedSlot.class_id}</span></div>
                <div><span className="text-gray-500">Salle:</span> <span className="font-medium">{selectedSlot.room?.name || '-'}</span></div>
                <div><span className="text-gray-500">Jour:</span> <span className="font-medium">{selectedSlot.day}</span> • P{selectedSlot.period}</div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button className="py-2 text-xs border rounded-xl hover:bg-gray-50">Modifier</button>
                <button className="py-2 text-xs border rounded-xl hover:bg-gray-50">Déplacer</button>
                <button className="py-2 text-xs border border-red-200 text-red-600 rounded-xl hover:bg-red-50">Verrouiller</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b bg-white flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {filter === 'all' ? 'Toutes les classes' : 'Classe filtrée'}
          </h2>
          <div className="text-sm text-gray-500">
            {slots.length} créneaux
          </div>
        </div>

        <div className="flex-1 p-4 overflow-hidden">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm h-full overflow-hidden">
            <CalendarView 
              slots={slots} 
              conflicts={conflicts} 
              onReload={loadData} 
              onSelect={setSelectedSlot} 
            />
          </div>
        </div>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel 
        conflicts={conflicts} 
        selectedSlot={selectedSlot} 
      />
    </div>
  );
}