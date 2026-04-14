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

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const items = await inventoryRepo.getAll(filter)
      setState({ items, loading: false, error: null })
    } catch (err: unknown) {
      setState({ items: [], loading: false, error: String(err) })
    }
  }, [filter])

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
