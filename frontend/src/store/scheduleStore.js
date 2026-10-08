import { create } from 'zustand'

export const useScheduleStore = create((set) => ({
  schedule: {},
  conflicts: [],
  selectedSlot: null,
  setSchedule: (schedule) => set({ schedule }),
  setConflicts: (conflicts) => set({ conflicts }),
  setSelectedSlot: (selectedSlot) => set({ selectedSlot })
}))
