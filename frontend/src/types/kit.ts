// types/kit.ts
//  kit model: inventory-based slots.

export type KitSlotType =
  | 'developer'
  | 'stop'
  | 'fixer'
  | 'wash_aid'
  | 'wetting_agent'

export type KitDeveloperSlotRole = 'bath_a' | 'bath_b'

export type KitSlot = {
  id: string
  slot_type: KitSlotType
  developer_slot_role?: KitDeveloperSlotRole
  inventory_item_id: string | null
  intended_recipe_id?: string
  order: number
  optional: boolean
  notes?: string
}

export type Kit = {
  id: string
  name: string
  description?: string
  slots: KitSlot[]
  created_at: string
  updated_at: string
}

export type KitGuideSlot = {
  slot_type: KitSlotType
  developer_slot_role?: KitDeveloperSlotRole
  recipe_id: string
}

export type KitGuide = {
  id: string
  name: string
  description: string
  slots: KitGuideSlot[]
}
