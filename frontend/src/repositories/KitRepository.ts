// repositories/KitRepository.ts
// Interface for the data access layer of Kits.

import type { Kit } from '../types/kit'

export interface KitRepository {
  getAll(): Promise<Kit[]>
  getById(id: string): Promise<Kit | null>
  save(kit: Kit): Promise<void>
  delete(id: string): Promise<void>
}
