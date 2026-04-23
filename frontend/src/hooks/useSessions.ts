import { useCallback, useEffect, useState } from 'react'
import { sessionRepo } from '@/repositories'
import type { DevSession } from '@/types/session'

type SessionsState = {
  sessions: DevSession[]
  loading: boolean
  error: string | null
}

export function useRecentSessions(limit = 5): SessionsState & { reload: () => Promise<void> } {
  const [state, setState] = useState<SessionsState>({
    sessions: [],
    loading: true,
    error: null,
  })

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const sessions = await sessionRepo.getRecentSessions(limit)
      setState({ sessions, loading: false, error: null })
    } catch (err: unknown) {
      setState({ sessions: [], loading: false, error: String(err) })
    }
  }, [limit])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  return { ...state, reload }
}

export function useSaveSession() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(async (session: DevSession) => {
    setLoading(true)
    setError(null)
    try {
      await sessionRepo.save(session)
    } catch (err: unknown) {
      setError(String(err))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { save, loading, error }
}
