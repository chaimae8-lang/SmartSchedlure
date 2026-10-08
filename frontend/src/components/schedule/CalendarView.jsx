import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import toast from 'react-hot-toast';

import { moveSlot } from '../../api/schedule';
import { dayDates } from '../../utils/conflicts';

const subjectColors = {
  MATH: '#2563eb',
  PHYS: '#f59e0b',
  SVT: '#10b981',
  ARAB: '#22c55e',
  FR: '#8b5cf6',
  ANG: '#06b6d4',
  HIST: '#a16207',
  PHIL: '#e11d48',
  INFO: '#0f766e',
  ISL: '#84cc16',
  EPS: '#ef4444',
};

const days = ['monday','tuesday','wednesday','thursday','friday','saturday'];

const periodTimes = {
  0: ['08:30', '10:00'],
  1: ['10:00', '12:00'],
  2: ['14:00', '16:00'],
  3: ['16:00', '18:30'],
};

function toEvents(slots, conflicts) {
  const conflictIds = new Set(
    conflicts.flatMap(c => c.slot_ids || [c.slot_id]).filter(Boolean)
  );

  return slots.map(slot => {
    const [startTime, endTime] =
      periodTimes[slot.period] || ['08:30','10:00'];

    const code = slot.subject?.code || String(slot.subject_id || '');
    const isConflict = conflictIds.has(slot.id);

    return {
      id: String(slot.id),
      title: code,
      start: `${dayDates[slot.day]}T${startTime}`,
      end: `${dayDates[slot.day]}T${endTime}`,
      backgroundColor: isConflict
        ? '#ef4444'
        : subjectColors[code] || '#64748b',
      borderColor: 'transparent',
      textColor: '#fff',
      extendedProps: slot,
    };
  });
}

export default function CalendarView({
  slots = [],
  conflicts = [],
  onReload,
  onSelect,
}) {
  const events = useMemo(() => toEvents(slots, conflicts), [slots, conflicts]);

  const handleEventDrop = async (info) => {
    const date = info.event.start;
    const dayIndex = (date.getDay() + 6) % 7;
    const day = days[dayIndex];

    const hour = date.getHours();
    let period = 0;
    if (hour >= 16) period = 3;
    else if (hour >= 14) period = 2;
    else if (hour >= 10) period = 1;

    try {
      await moveSlot(info.event.id, { day, period });
      toast.success('Moved');
      onReload?.();
    } catch (e) {
      toast.error('Failed');
      info.revert();
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen bg-slate-100 p-1">

        <div className="h-full bg-white rounded-xl shadow-md border border-slate-200 flex flex-col overflow-hidden">

          <div className="flex-1 min-h-0 overflow-auto">

            <FullCalendar
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale="fr"
              height="100%"

              editable
              droppable
              allDaySlot={false}
              hiddenDays={[0]}

              events={events}
              eventDrop={handleEventDrop}
              eventClick={(info) => onSelect?.(info.event.extendedProps)}

              slotMinTime="08:30:00"
              slotMaxTime="18:30:00"
              slotDuration="00:30:00"
              slotLabelInterval="01:00"

              nowIndicator

              headerToolbar={{
                left: 'prev,next',
                center: 'title',
                right: '',
              }}

              dayHeaderFormat={{ weekday: 'short' }}

              eventClassNames="rounded-sm text-[9px] border-0 cursor-pointer"

              eventContent={(arg) => {
                const slot = arg.event.extendedProps;

                return (
                  <div className="p-0.5 flex flex-col h-full overflow-hidden leading-none">

                    <div className="font-semibold text-[9px] truncate">
                      {arg.event.title}
                    </div>

                    <div className="text-[8px] opacity-80 truncate">
                      {slot.teacher?.first_name} {slot.teacher?.last_name}
                    </div>

                    <div className="mt-auto text-[8px] opacity-70 flex justify-between">
                      <span>{slot.class?.name}</span>
                      <span>{slot.room?.name}</span>
                    </div>

                  </div>
                );
              }}
            />

          </div>
        </div>
      </div>

      {/* 🎨 ALTERNATING DAY COLORS */}
      <style>{`
        .fc {
          font-size: 10px;
        }

        .fc-toolbar {
          padding: 4px 6px !important;
        }

        .fc-toolbar-title {
          font-size: 12px !important;
        }

        .fc-timegrid-slot {
          height: 30px !important;
        }

        .fc-col-header-cell-cushion {
          font-size: 10px;
        }

        /* ================================
           🌈 DAY BACKGROUND COLORS
        ================================= */

        .fc-day-mon,
        .fc-day-wed,
        .fc-day-fri {
          background-color: #f8fafc !important; /* light slate */
        }

        .fc-day-tue,
        .fc-day-thu,
        .fc-day-sat {
          background-color: #eef2ff !important; /* light indigo */
        }

        /* keep grid clean */
        .fc-scrollgrid {
          border: none !important;
        }

        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #e5e7eb;
        }
      `}</style>
    </DndProvider>
  );
}