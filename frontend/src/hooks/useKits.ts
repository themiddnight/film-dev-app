import { useCallback, useEffect, useState } from 'react'
import { kitRepo } from '../repositories'
import type { Kit } from '../types/kit'

type KitState = {
  kits: Kit[]
  loading: boolean
  error: string | null
}

export function useKits() {
  const [state, setState] = useState<KitState>({
    kits: [],
    loading: true,
    error: null,
  })

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const kits = await kitRepo.getAll()
      setState({ kits, loading: false, error: null })
    } catch (err: unknown) {
      setState({ kits: [], loading: false, error: String(err) })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const save = useCallback(
    async (kit: Kit) => {
      await kitRepo.save(kit)
      await reload()
    },
    [reload],
  )

  const remove = useCallback(
    async (id: string) => {
      await kitRepo.delete(id)
      await reload()
    },
    [reload],
  )

  return {
    ...state,
    reload,
    save,
    remove,
  }
}
