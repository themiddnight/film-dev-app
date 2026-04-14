import type { DevSession } from '../types/session'

export interface SessionRepository {
  getAll(): Promise<DevSession[]>
  getById(id: string): Promise<DevSession | null>
  save(session: DevSession): Promise<void>
  getRecentSessions(limit?: number): Promise<DevSession[]>
}
