// repositories/local/LocalKitRepository.ts
// Phase 1b + 1c implementation: อ่าน/เขียน localStorage
// Data is throwaway — ไม่มี migration plan เมื่อไป Phase 3
//
// localStorage keys:
//   'my-kit'          → UserKit (equipment + bottles)
//   'my-kit-devkits'  → DevKit[] (Phase 1c)

import type { KitRepository } from '../KitRepository'
import type { ChemicalBottle, DevKit, EquipmentProfile, UserKit } from '../../types/kit'
import { DEFAULT_USER_KIT } from '../../types/kit'

const STORAGE_KEY = 'my-kit'
const DEVKITS_KEY = 'my-kit-devkits'

function generateId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

export class LocalKitRepository implements KitRepository {
  private load(): UserKit {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return structuredClone(DEFAULT_USER_KIT)
      return JSON.parse(raw) as UserKit
    } catch {
      return structuredClone(DEFAULT_USER_KIT)
    }
  }

  private save(kit: UserKit): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kit))
  }

  async getKit(): Promise<UserKit> {
    return this.load()
  }

  async saveEquipment(profile: EquipmentProfile): Promise<void> {
    const kit = this.load()
    kit.equipment = profile
    this.save(kit)
  }

  async addBottle(
    bottle: Omit<ChemicalBottle, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ChemicalBottle> {
    const kit = this.load()
    const timestamp = now()
    const newBottle: ChemicalBottle = {
      ...bottle,
      id: generateId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    kit.bottles.push(newBottle)
    this.save(kit)
    return newBottle
  }

  async updateBottle(
    id: string,
    updates: Partial<Omit<ChemicalBottle, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<void> {
    const kit = this.load()
    const idx = kit.bottles.findIndex((b) => b.id === id)
    if (idx === -1) throw new Error(`Bottle not found: ${id}`)
    kit.bottles[idx] = { ...kit.bottles[idx], ...updates, updatedAt: now() }
    this.save(kit)
  }

  async deleteBottle(id: string): Promise<void> {
    const kit = this.load()
    kit.bottles = kit.bottles.filter((b) => b.id !== id)
    this.save(kit)
  }

  async incrementRolls(bottleId: string, count = 1): Promise<void> {
    const kit = this.load()
    const idx = kit.bottles.findIndex((b) => b.id === bottleId)
    if (idx === -1) throw new Error(`Bottle not found: ${bottleId}`)
    kit.bottles[idx].rollsDeveloped += count
    kit.bottles[idx].updatedAt = now()
    this.save(kit)
  }

  // ── Phase 1c: DevKit CRUD ──────────────────────────────────────────────────

  private loadDevKits(): DevKit[] {
    try {
      const raw = localStorage.getItem(DEVKITS_KEY)
      if (!raw) return []
      return JSON.parse(raw) as DevKit[]
    } catch {
      return []
    }
  }

  private saveDevKits(kits: DevKit[]): void {
    localStorage.setItem(DEVKITS_KEY, JSON.stringify(kits))
  }

  async saveDevKit(kit: DevKit): Promise<void> {
    const kits = this.loadDevKits()
    const idx = kits.findIndex((k) => k.id === kit.id)
    if (idx === -1) {
      kits.push(kit)
    } else {
      kits[idx] = kit
    }
    this.saveDevKits(kits)
  }

  async getDevKits(recipeId?: string): Promise<DevKit[]> {
    const kits = this.loadDevKits()
    if (recipeId) return kits.filter((k) => k.recipeId === recipeId)
    return kits
  }

  async deleteDevKit(id: string): Promise<void> {
    const kits = this.loadDevKits()
    this.saveDevKits(kits.filter((k) => k.id !== id))
  }
}
