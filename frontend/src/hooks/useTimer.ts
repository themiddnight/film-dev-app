// hooks/useTimer.ts — interval hook สำหรับ Active Timer
import { useEffect, useRef } from 'react'
import { useDevelopStore } from '../store/developStore'

export function useTimer() {
  const timerState = useDevelopStore((s) => s.timerState)
  const tickTimer = useDevelopStore((s) => s.tickTimer)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => tickTimer(), 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerState, tickTimer])
}

// Format seconds to MM:SS
export function formatTime(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60)
  const s = Math.abs(seconds) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
