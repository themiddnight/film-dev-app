import { useCallback, useEffect, useState } from 'react'
import { inventoryRepo } from '../repositories'
import type { InventoryFilter, InventoryItem } from '../types/inventory'

type InventoryState = {
  items: InventoryItem[]
  loading: boolean
  error: string | null
}

export function useInventory(filter?: InventoryFilter) {
  const [state, setState] = useState<InventoryState>({
    items: [],
    loading: true,
    error: null,
  })

  // Destructure to primitives — same pattern as useRecipes — so consumers can pass
  // inline object literals without causing reload on every render
  const { step_type, status, search } = filter ?? {}

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const items = await inventoryRepo.getAll({ step_type, status, search })
      setState({ items, loading: false, error: null })
    } catch (err: unknown) {
      setState({ items: [], loading: false, error: String(err) })
    }
  }, [step_type, status, search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  const save = useCallback(
    async (item: InventoryItem) => {
      await inventoryRepo.save(item)
      await reload()
    },
    [reload],
  )

  const remove = useCallback(
    async (id: string) => {
      await inventoryRepo.delete(id)
      await reload()
    },
    [reload],
  )

  const markStatus = useCallback(
    async (id: string, status: InventoryItem['status']) => {
      await inventoryRepo.updateStatus(id, status)
      await reload()
    },
    [reload],
  )

  return {
    ...state,
    reload,
    save,
    remove,
    markStatus,
  }
}
