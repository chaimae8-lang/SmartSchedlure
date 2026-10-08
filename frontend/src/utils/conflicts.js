export function detectLocalConflicts(slots) {
  const conflicts = []
  const seen = new Map()
  slots.forEach((slot) => {
    ;['class_id', 'teacher_id', 'room_id'].forEach((field) => {
      const key = `${field}:${slot[field]}:${slot.day}:${slot.period}`
      if (seen.has(key)) conflicts.push({ type: field, slot_ids: [seen.get(key), slot.id], day: slot.day, period: slot.period })
      seen.set(key, slot.id)
    })
  })
  return conflicts
}

export const periodTimes = {
  0: ['08:00:00', '10:00:00'],
  1: ['10:00:00', '12:00:00'],
  2: ['14:00:00', '16:00:00'],
  3: ['16:00:00', '18:00:00']
}

export const dayDates = {
  monday: '2026-05-18',
  tuesday: '2026-05-19',
  wednesday: '2026-05-20',
  thursday: '2026-05-21',
  friday: '2026-05-22',
  saturday: '2026-05-23'
}
