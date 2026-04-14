// repositories/KitRepository.ts
// Interface สำหรับ data access layer ของ  Kits.

import type { Kit } from '../types/kit'

export interface KitRepository {
  getAll(): Promise<Kit[]>
  getById(id: string): Promise<Kit | null>
  save(kit: Kit): Promise<void>
  delete(id: string): Promise<void>
}
