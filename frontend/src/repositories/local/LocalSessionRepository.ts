import type { SessionRepository } from '../SessionRepository'
import type { DevSession } from '../../types/session'

const STORAGE_KEY = 'sessions'

function getCreatedAt(session: DevSession): string {
  return session.created_at || session.started_at
}

export class LocalSessionRepository implements SessionRepository {
  private load(): DevSession[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      return JSON.parse(raw) as DevSession[]
    } catch {
      return []
    }
  }

  private saveAll(sessions: DevSession[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  }

  async getAll(): Promise<DevSession[]> {
    return this.load().sort((a, b) => getCreatedAt(b).localeCompare(getCreatedAt(a)))
  }

  async getById(id: string): Promise<DevSession | null> {
    return this.load().find((session) => session.id === id) ?? null
  }

  async save(session: DevSession): Promise<void> {
    const sessions = this.load()
    const idx = sessions.findIndex((s) => s.id === session.id)
    if (idx === -1) sessions.push(session)
    else sessions[idx] = session
    this.saveAll(sessions)
  }

  async getRecentSessions(limit = 5): Promise<DevSession[]> {
    const sorted = await this.getAll()
    return sorted.slice(0, Math.max(1, limit))
  }
}
