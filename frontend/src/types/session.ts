export type SessionSource =
  | { type: 'kit'; kit_id: string; kit_name_snapshot: string }
  | { type: 'recipes'; recipe_ids: string[] }

export type InventoryUpdate = {
  inventory_item_id: string
  rolls_added: number
  time_compensation_pct?: number
}

export type DevSession = {
  id: string
  source: SessionSource
  film_format: '35mm' | '120' | '4x5' | 'other'
  rolls_count: number
  temperature_celsius: number
  dev_type: 'N-2' | 'N-1' | 'N' | 'N+1' | 'N+2'
  agitation_method: 'inversion' | 'rotation' | 'stand' | 'rotary'
  target_duration_seconds: number
  actual_duration_seconds?: number
  inventory_updates: InventoryUpdate[]
  status: 'completed' | 'abandoned'
  notes?: string
  started_at: string
  completed_at?: string
  created_at: string
}
