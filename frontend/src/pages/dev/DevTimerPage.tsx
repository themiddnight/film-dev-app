import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pause, Play } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { useDevSessionStore } from '../../store/devSessionStore'
import { inventoryRepo, kitRepo, recipeRepo } from '../../repositories'
import { applyAdjustments, getRecipeTimingSeconds } from '../../utils/dev'
import { useSettingsStore } from '../../store/settingsStore'

type TimerStep = {
  id: string
  name: string
  durationSeconds: number
  agitation?: { initial_seconds: number; interval_seconds: number; duration_seconds: number }
  transitionWarning?: string
}

function format(seconds: number): string {
  const mm = Math.floor(seconds / 60)
  const ss = seconds % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export default function DevTimerPage() {
  const navigate = useNavigate()
  const { source, temperature_celsius, dev_type, agitation_method } = useDevSessionStore()
  const { sound, vibrate } = useSettingsStore()
  const [steps, setSteps] = useState<TimerStep[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(true)
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null)

  const currentStep = steps[stepIndex]

  useEffect(() => {
    if (!source) {
      navigate('/dev')
    }
  }, [source])

  useEffect(() => {
    if (!source) return
    const resolvedSource = source
    let cancelled = false

    async function buildSteps() {
      const built: TimerStep[] = []

      if (resolvedSource.type === 'recipe') {
        const recipe = await recipeRepo.getById(resolvedSource.recipeId)
        if (recipe) {
          const base = getRecipeTimingSeconds(recipe, temperature_celsius, dev_type)
          const adjusted = applyAdjustments(base, recipe, agitation_method)
          built.push({
            id: recipe.id,
            name: recipe.name,
            durationSeconds: adjusted.seconds,
            agitation: recipe.agitation?.type === 'inversion'
              ? {
                  initial_seconds: recipe.agitation.initial_seconds,
                  interval_seconds: recipe.agitation.interval_seconds,
                  duration_seconds: recipe.agitation.duration_seconds,
                }
              : undefined,
          })
        }
      } else {
        const kit = await kitRepo.getById(resolvedSource.kitId)
        const allItems = await inventoryRepo.getAll()
        const slotItems = (kit?.slots ?? [])
          .sort((a, b) => a.order - b.order)
          .map((slot) => ({ slot, item: slot.inventory_item_id ? allItems.find((it) => it.id === slot.inventory_item_id) : null }))
          .filter((entry) => !!entry.item)

        for (let i = 0; i < slotItems.length; i++) {
          const entry = slotItems[i]
          const item = entry.item!
          const recipe = await recipeRepo.getById(item.recipe_id)
          if (!recipe) continue

          let duration = 60
          if (item.step_type === 'developer') {
            const base = getRecipeTimingSeconds(recipe, temperature_celsius, dev_type)
            duration = applyAdjustments(base, recipe, agitation_method, item.use_count).seconds
          } else if (item.step_type === 'fixer') {
            duration = 480
          } else if (item.step_type === 'wash_aid') {
            duration = 120
          } else if (item.step_type === 'wetting_agent') {
            duration = 60
          }

          const next = slotItems[i + 1]
          const nextIsDeveloper = next?.item?.step_type === 'developer'
          const transitionWarning = recipe.constraints?.is_two_bath && nextIsDeveloper
            ? 'ห้ามล้างน้ำ — เท Bath B ทันที'
            : undefined

          built.push({
            id: `${item.id}-${i}`,
            name: item.name,
            durationSeconds: duration,
            agitation: recipe.agitation?.type === 'inversion'
              ? {
                  initial_seconds: recipe.agitation.initial_seconds,
                  interval_seconds: recipe.agitation.interval_seconds,
                  duration_seconds: recipe.agitation.duration_seconds,
                }
              : undefined,
            transitionWarning,
          })
        }
      }

      if (!cancelled) {
        const filtered = built.filter((step) => step.durationSeconds > 0)
        setSteps(filtered)
        setStepIndex(0)
        setRemaining(filtered[0]?.durationSeconds ?? 0)
      }
    }

    void buildSteps()
    return () => {
      cancelled = true
    }
  }, [source?.type, source && 'kitId' in source ? source.kitId : '', source && 'recipeId' in source ? source.recipeId : '', temperature_celsius, dev_type, agitation_method])

  useEffect(() => {
    if (!running || remaining <= 0) return
    const timer = window.setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running, remaining])

  const isAgitationTime = useMemo(() => {
    if (!currentStep?.agitation) return false
    const elapsed = currentStep.durationSeconds - remaining
    if (elapsed <= 0) return false
    const agi = currentStep.agitation
    return elapsed <= agi.initial_seconds || ((elapsed - agi.initial_seconds) % agi.interval_seconds < agi.duration_seconds)
  }, [currentStep, remaining])

  useEffect(() => {
    if (!isAgitationTime) return
    if (sound) {
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.2)
      } catch {
        // ignore audio failures
      }
    }
    if (vibrate && navigator.vibrate) navigator.vibrate([120, 80, 120])
  }, [isAgitationTime, sound, vibrate])

  const progress = useMemo(() => {
    if (!currentStep || currentStep.durationSeconds <= 0) return 0
    return (currentStep.durationSeconds - remaining) / currentStep.durationSeconds
  }, [currentStep, remaining])

  function nextStepOrDone() {
    if (!currentStep) return

    if (stepIndex + 1 >= steps.length) {
      navigate('/dev/done')
      return
    }

    const next = steps[stepIndex + 1]
    setStepIndex(stepIndex + 1)
    setRemaining(next.durationSeconds)
    setRunning(true)
    setTransitionMessage(next.transitionWarning ?? null)
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar title="Dev Timer" onBack={() => navigate('/dev/setup')} />

      <progress className="progress progress-primary w-full h-1 rounded-none" value={progress} max={1} />

      <div className="flex-1 min-h-0 flex flex-col justify-center items-center p-4 gap-3">
        <div className="text-center">
          <div className="text-sm text-sub">{currentStep ? `${stepIndex + 1}/${steps.length}` : '-'}</div>
          <div className="text-xl font-semibold mt-0.5">{currentStep?.name ?? 'Loading...'}</div>
        </div>

        <div className={`text-7xl font-bold font-mono tabular-nums ${isAgitationTime ? 'text-warning' : ''}`}>{format(remaining)}</div>
        <p className="text-sm text-sub">Target: {format(currentStep?.durationSeconds ?? 0)}</p>

        {isAgitationTime && (
          <div className="alert alert-warning py-2 text-sm">Agitate now</div>
        )}

        {remaining === 0 && currentStep?.transitionWarning && (
          <div className="alert alert-error py-2 text-sm">{currentStep.transitionWarning}</div>
        )}
        {transitionMessage && remaining > 0 && (
          <div className="alert alert-error py-2 text-sm">{transitionMessage}</div>
        )}

        <button className="btn btn-circle btn-lg" onClick={() => setRunning((prev) => !prev)}>
          {running ? <Pause size={24} /> : <Play size={24} />}
        </button>
      </div>

      <div className="p-4 border-t border-base-300">
        <button
          className="btn btn-primary w-full"
          onClick={nextStepOrDone}
          disabled={remaining > 0}
        >
          {stepIndex + 1 >= steps.length ? 'Complete session' : 'Next step'}
        </button>
      </div>
    </div>
  )
}
