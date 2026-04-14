import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Equipment = {
  tank_type: 'paterson' | 'stainless' | 'jobo' | 'other'
  agitation_method: 'inversion' | 'rotation' | 'stand' | 'rotary'
  water_hardness: 'soft' | 'medium' | 'hard'
}

type EquipmentStore = {
  equipment: Equipment
  setEquipment: (next: Partial<Equipment>) => void
}

const DEFAULT_EQUIPMENT: Equipment = {
  tank_type: 'paterson',
  agitation_method: 'inversion',
  water_hardness: 'medium',
}

export const useEquipmentStore = create<EquipmentStore>()(
  persist(
    (set) => ({
      equipment: DEFAULT_EQUIPMENT,
      setEquipment: (next) => set((prev) => ({ equipment: { ...prev.equipment, ...next } })),
    }),
    {
      name: 'equipment',
    },
  ),
)
