// repositories/local/LocalKitRepository.ts
//  implementation: inventory-based kits in localStorage.

import type { KitRepository } from '../KitRepository'
import type { Kit } from '../../types/kit'
const KITS_KEY = 'kits'

function now(): string {
  return new Date().toISOString()
}

export class LocalKitRepository implements KitRepository {
  private loadKits(): Kit[] {
    try {
      const raw = localStorage.getItem(KITS_KEY)
      if (!raw) return []
      return JSON.parse(raw) as Kit[]
    } catch {
      return []
    }
  }

  private saveKits(kits: Kit[]): void {
    localStorage.setItem(KITS_KEY, JSON.stringify(kits))
  }

  async getAll(): Promise<Kit[]> {
    return this.loadKits()
  }

  async getById(id: string): Promise<Kit | null> {
    return this.loadKits().find((kit) => kit.id === id) ?? null
  }

  async save(kit: Kit): Promise<void> {
    const kits = this.loadKits()
    const nowIso = now()
    const normalized: Kit = {
      ...kit,
      created_at: kit.created_at || nowIso,
      updated_at: nowIso,
    }

    const idx = kits.findIndex((k) => k.id === normalized.id)
    if (idx === -1) kits.push(normalized)
    else kits[idx] = normalized
    this.saveKits(kits)
  }

  async delete(id: string): Promise<void> {
    const kits = this.loadKits()
    this.saveKits(kits.filter((kit) => kit.id !== id))
  }
}
