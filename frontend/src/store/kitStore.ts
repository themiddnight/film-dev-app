// store/kitStore.ts
// Zustand store wrapper สำหรับ KitRepository
// ทำให้ React components subscribe ต่อ My Kit state ได้ง่าย

import { create } from 'zustand'
import { kitRepo } from '../repositories'
import type { ChemicalBottle, DevKit, EquipmentProfile, UserKit } from '../types/kit'
import { DEFAULT_USER_KIT } from '../types/kit'

type KitStore = {
  kit: UserKit
  loading: boolean

  // Load from localStorage
  loadKit: () => Promise<void>

  // Equipment
  saveEquipment: (profile: EquipmentProfile) => Promise<void>

  // Bottles
  addBottle: (bottle: Omit<ChemicalBottle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ChemicalBottle>
  updateBottle: (id: string, updates: Partial<Omit<ChemicalBottle, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteBottle: (id: string) => Promise<void>
  incrementRolls: (bottleId: string, count?: number) => Promise<void>

  // Helper: หา bottles ที่ชื่อขึ้นต้นด้วย recipeName prefix
  getMatchingBottles: (recipeName: string) => ChemicalBottle[]

  // Helper: หา bottles ตาม role (สำหรับ Kit slot dropdown)
  getBottlesByRole: (role: ChemicalBottle['role']) => ChemicalBottle[]

  // ── Phase 1c: DevKit ────────────────────────────────────────────────────────
  devKits: DevKit[]
  loadDevKits: (recipeId?: string) => Promise<void>
  saveDevKit: (kit: DevKit) => Promise<void>
  deleteDevKit: (id: string) => Promise<void>
}

export const useKitStore = create<KitStore>()((set, get) => ({
  kit: structuredClone(DEFAULT_USER_KIT),
  loading: false,
  devKits: [],

  loadKit: async () => {
    set({ loading: true })
    const kit = await kitRepo.getKit()
    set({ kit, loading: false })
  },

  saveEquipment: async (profile) => {
    await kitRepo.saveEquipment(profile)
    const kit = await kitRepo.getKit()
    set({ kit })
  },

  addBottle: async (bottle) => {
    const newBottle = await kitRepo.addBottle(bottle)
    const kit = await kitRepo.getKit()
    set({ kit })
    return newBottle
  },

  updateBottle: async (id, updates) => {
    await kitRepo.updateBottle(id, updates)
    const kit = await kitRepo.getKit()
    set({ kit })
  },

  deleteBottle: async (id) => {
    await kitRepo.deleteBottle(id)
    const kit = await kitRepo.getKit()
    set({ kit })
  },

  incrementRolls: async (bottleId, count = 1) => {
    await kitRepo.incrementRolls(bottleId, count)
    const kit = await kitRepo.getKit()
    set({ kit })
  },

  getMatchingBottles: (recipeName) => {
    const { kit } = get()
    const recipePrefix = recipeName.split(' + ')[0].toLowerCase()
    return kit.bottles.filter((b) =>
      b.developerName.toLowerCase().startsWith(recipePrefix)
    )
  },

  getBottlesByRole: (role) => {
    const { kit } = get()
    return kit.bottles.filter((b) => b.role === role)
  },

  // ── Phase 1c: DevKit ──────────────────────────────────────────────────────

  loadDevKits: async (recipeId) => {
    const devKits = await kitRepo.getDevKits(recipeId)
    set({ devKits })
  },

  saveDevKit: async (kit) => {
    await kitRepo.saveDevKit(kit)
    // reload ทั้งหมด (ไม่ filter recipeId เพื่อให้ครบเสมอ)
    const devKits = await kitRepo.getDevKits()
    set({ devKits })
  },

  deleteDevKit: async (id) => {
    await kitRepo.deleteDevKit(id)
    const devKits = await kitRepo.getDevKits()
    set({ devKits })
  },
}))
