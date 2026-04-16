import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Pause, Play } from 'lucide-react'
import Navbar from '../../components/Navbar'
import ConfirmLeaveModal from '../../components/ConfirmLeaveModal'
import { useDevSessionStore } from '../../store/devSessionStore'
import { inventoryRepo, kitRepo, recipeRepo } from '../../repositories'
import { applyAdjustments, getRecipeTimingSeconds } from '../../utils/dev'
import { useSettingsStore } from '../../store/settingsStore'
import type { InventoryItem } from '../../types/inventory'
import type { Recipe } from '../../types/recipe'

type TimerStep = {
  id: string
  name: string
  durationSeconds: number
  agitation?: { initial_seconds: number; interval_seconds: number; duration_seconds: number }
  warnings?: string[]
  transitionWarning?: string
}

function getTwoBathTimingSteps(recipe: Recipe): Array<{ name: string; seconds: number; agitation?: TimerStep['agitation']; warnings?: string[]; transition_warning?: string }> {
  const devSteps = (recipe.develop_steps ?? []).filter((step) => step.type === 'developer' || step.type === 'activator')
  return devSteps
    .map((step) => ({
      name: step.name,
      seconds: typeof step.duration_seconds === 'number' ? step.duration_seconds : 0,
      agitation: step.agitation,
      warnings: step.warnings,
      transition_warning: step.transition_warning,
    }))
    .filter((step) => step.seconds > 0)
}

function getDeveloperDuration(recipe: Recipe, item: InventoryItem | null, tempCelsius: number, devType: 'N-2' | 'N-1' | 'N' | 'N+1' | 'N+2', agitationMethod: 'inversion' | 'rotation' | 'stand' | 'rotary'): number {
  if (recipe.constraints?.is_two_bath && (recipe.develop_steps?.length ?? 0) > 0) {
    const twoBathSteps = getTwoBathTimingSteps(recipe)
    // Bath B is always fixed — chemistry constraint: alkali activation time never changes with reuse
    if (item?.developer_bath_role === 'bath_b') {
      return twoBathSteps[1]?.seconds ?? 0
    }
    // Bath A only: apply reuse compensation
    const bathABase = twoBathSteps[0]?.seconds ?? 0
    return applyAdjustments(bathABase, recipe, agitationMethod, item?.use_count).seconds
  }

  const base = getRecipeTimingSeconds(recipe, tempCelsius, devType)
  return applyAdjustments(base, recipe, agitationMethod, item?.use_count).seconds
}

function format(seconds: number): string {
  const mm = Math.floor(seconds / 60)
  const ss = seconds % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export default function DevTimerPage() {
  const navigate = useNavigate()
  const { source, temperature_celsius, dev_type, agitation_method } = useDevSessionStore()
  const { sound, vibrate, screenFlash } = useSettingsStore()
  const [steps, setSteps] = useState<TimerStep[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'ready' | 'running'>('ready')
  const [isFlashing, setIsFlashing] = useState(false)
  const [manualExitModal, setManualExitModal] = useState(false)
  const [pendingNavigateHome, setPendingNavigateHome] = useState(false)
  const prevAgitationRef = useRef(false)
  const flashIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sentinel ref — tracks whether we've pushed a blocking history entry
  const sentinelRef = useRef(false)
  // Mirror running state into a ref so the popstate handler always sees the latest value
  const runningRef = useRef(running)
  useEffect(() => { runningRef.current = running }, [running])

  // Push a sentinel history entry when the timer phase is active so the back
  // button can be intercepted. Remove the flag when the phase ends.
  useEffect(() => {
    if (phase === 'running' && !sentinelRef.current) {
      window.history.pushState({ timerSentinel: true }, '')
      sentinelRef.current = true
    }
    if (phase !== 'running') {
      sentinelRef.current = false
    }
  }, [phase])

  // Intercept the back-button popstate while the sentinel is active
  useEffect(() => {
    const handlePopState = () => {
      if (!sentinelRef.current) return
      // Re-push sentinel to keep blocking in place
      window.history.pushState({ timerSentinel: true }, '')
      if (runningRef.current) {
        setRunning(false) // pause, modal will appear on next render
      }
      setManualExitModal(true)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const showExitModal = manualExitModal

  // Navigate home after phase has been cleared
  useEffect(() => {
    if (pendingNavigateHome) {
      navigate('/dev')
    }
  }, [pendingNavigateHome, navigate])

  const currentStep = steps[stepIndex]
  const nextStep = steps[stepIndex + 1] ?? null
  const sourceKitId = source && 'kit_id' in source ? source.kit_id : null
  const sourceRecipeId = source && 'recipe_id' in source ? source.recipe_id : null

  useEffect(() => {
    if (!source) {
      navigate('/dev')
    }
  }, [source, navigate])

  useEffect(() => {
    if (!source) return
    const resolvedSource = source
    let cancelled = false

    async function buildSteps() {
      const built: TimerStep[] = []

      if (resolvedSource.type === 'recipe') {
        const recipe = await recipeRepo.getById(resolvedSource.recipe_id)
        if (recipe) {
          if (recipe.constraints?.is_two_bath && (recipe.develop_steps?.length ?? 0) > 0) {
            const twoBathSteps = getTwoBathTimingSteps(recipe)
            // Two-bath anonymous session: no inventory item → no use_count, no Bath A compensation.
            // Agitation multiplier is also blocked for two-bath in applyAdjustments.
            // Both steps use fixed durations from develop_steps directly.
            // TODO: if recipe source ever gains inventory lookup, apply compensation to Bath A only here.

            twoBathSteps.forEach((step, index) => {
              const isLast = index === twoBathSteps.length - 1
              built.push({
                id: `${recipe.id}-${index}`,
                name: step.name,
                durationSeconds: step.seconds,
                agitation: step.agitation,
                warnings: step.warnings,
                transitionWarning: !isLast ? (step.transition_warning ?? 'Do not rinse — pour Bath B immediately') : undefined,
              })
            })
          } else {
            const base = getRecipeTimingSeconds(recipe, temperature_celsius, dev_type)
            const adjusted = applyAdjustments(base, recipe, agitation_method)
            const devStep = (recipe.develop_steps ?? []).find((s) => s.type === 'developer')
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
              warnings: devStep?.warnings,
            })
          }
        }
      } else {
        const kit = await kitRepo.getById(resolvedSource.kit_id)
        const allItems = await inventoryRepo.getAll()
        const slotItems = (kit?.slots ?? [])
          .sort((a, b) => a.order - b.order)
          .map((slot) => ({ slot, item: slot.inventory_item_id ? allItems.find((it) => it.id === slot.inventory_item_id) : null }))

        for (let i = 0; i < slotItems.length; i++) {
          const entry = slotItems[i]
          const { slot, item } = entry

          // Stop slot with no item → water rinse fallback
          if (slot.slot_type === 'stop' && !item) {
            built.push({
              id: `water-rinse-${i}`,
              name: 'Water Rinse',
              durationSeconds: 45,
              warnings: ['No stop bath in kit — use running water rinse instead (continuous agitation)'],
            })
            continue
          }

          if (!item) continue
          const recipe = await recipeRepo.getById(item.recipe_id)
          if (!recipe) continue

          let duration = 60
          if (item.step_type === 'developer') {
            duration = getDeveloperDuration(recipe, item, temperature_celsius, dev_type, agitation_method)
          } else if (item.step_type === 'fixer') {
            duration = 480
          } else if (item.step_type === 'wash_aid') {
            duration = 120
          } else if (item.step_type === 'wetting_agent') {
            duration = 60
          }

          const next = slotItems[i + 1]
          const nextIsBathB = next?.item?.step_type === 'developer' && next.item?.developer_bath_role === 'bath_b'
          const transitionWarning = item.step_type === 'developer' && item.developer_bath_role === 'bath_a' && nextIsBathB
            ? (getTwoBathTimingSteps(recipe)[0]?.transition_warning ?? 'Do not rinse — pour Bath B immediately')
            : undefined

          built.push({
            id: `${item.id}-${i}`,
            name: item.name,
            durationSeconds: duration,
            agitation: (() => {
              // Two-bath recipes store agitation on develop_steps, not top-level
              if (recipe.constraints?.is_two_bath && item.step_type === 'developer') {
                const twoBathSteps = getTwoBathTimingSteps(recipe)
                const stepAgitation = item.developer_bath_role === 'bath_b'
                  ? twoBathSteps[1]?.agitation
                  : twoBathSteps[0]?.agitation
                return stepAgitation ?? undefined
              }
              return recipe.agitation?.type === 'inversion'
                ? {
                    initial_seconds: recipe.agitation.initial_seconds,
                    interval_seconds: recipe.agitation.interval_seconds,
                    duration_seconds: recipe.agitation.duration_seconds,
                  }
                : undefined
            })(),
            transitionWarning,
          })
        }
      }

      if (!cancelled) {
        const filtered = built.filter((step) => step.durationSeconds > 0)
        setSteps(filtered)
        setStepIndex(0)
        setRemaining(filtered[0]?.durationSeconds ?? 0)
        setPhase('ready')
        setRunning(false)
      }
    }

    void buildSteps()
    return () => {
      cancelled = true
    }
  }, [source, sourceKitId, sourceRecipeId, temperature_celsius, dev_type, agitation_method])

  // Countdown interval
  useEffect(() => {
    if (!running || remaining <= 0) return
    const timer = window.setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running, remaining])

  const isTimerActive = running && remaining > 0

  const isAgitationTime = useMemo(() => {
    if (!currentStep?.agitation || phase !== 'running') return false
    const elapsed = currentStep.durationSeconds - remaining
    if (elapsed <= 0) return false
    const agi = currentStep.agitation
    return elapsed <= agi.initial_seconds || ((elapsed - agi.initial_seconds) % agi.interval_seconds < agi.duration_seconds)
  }, [currentStep, remaining, phase])

  // Fire reminders when agitation window starts (sound + vibrate on leading edge)
  useEffect(() => {
    const justStarted = isAgitationTime && !prevAgitationRef.current
    prevAgitationRef.current = isAgitationTime
    if (!justStarted) return

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

  // Screen flash — blink continuously while agitating and running
  useEffect(() => {
    if (!screenFlash) return
    if (isAgitationTime && running) {
      const blink = () => {
        setIsFlashing(true)
        setTimeout(() => setIsFlashing(false), 300)
      }
      blink()
      flashIntervalRef.current = setInterval(blink, 900)
    } else {
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current)
        flashIntervalRef.current = null
      }
      setTimeout(() => setIsFlashing(false), 0)
    }
    return () => {
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current)
        flashIntervalRef.current = null
      }
    }
  }, [isAgitationTime, running, screenFlash])

  const progress = useMemo(() => {
    if (!currentStep || currentStep.durationSeconds <= 0) return 0
    return (currentStep.durationSeconds - remaining) / currentStep.durationSeconds
  }, [currentStep, remaining])

  const overallProgress = useMemo(() => {
    const totalSeconds = steps.reduce((sum, s) => sum + s.durationSeconds, 0)
    if (totalSeconds <= 0) return 0
    const completedSeconds = steps.slice(0, stepIndex).reduce((sum, s) => sum + s.durationSeconds, 0)
    const currentElapsed = currentStep ? currentStep.durationSeconds - remaining : 0
    return (completedSeconds + currentElapsed) / totalSeconds
  }, [steps, stepIndex, currentStep, remaining])

  function startStep() {
    setRunning(true)
    setPhase('running')
  }

  function advanceOrDone() {
    if (!currentStep) return
    if (stepIndex + 1 >= steps.length) {
      navigate('/dev/done')
      return
    }
    const next = steps[stepIndex + 1]
    setStepIndex(stepIndex + 1)
    setRemaining(next.durationSeconds)
    setRunning(false)
    setPhase('ready')
  }

  // ── Ready screen ──────────────────────────────────────────────────────────────
  if (!steps.length || !currentStep) {
    return (
      <div className="flex flex-col h-full">
        <Navbar title="Dev Timer" onBack={() => navigate('/dev/setup')} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-sub">Loading steps...</p>
        </div>
      </div>
    )
  }

  // ── Unified single-return layout ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-base-100 relative">
      {/* Screen flash overlay — always mounted, opacity driven for smooth transition */}
      <div
        className="absolute inset-0 z-50 bg-warning/40 pointer-events-none transition-opacity duration-300"
        style={{ opacity: isFlashing ? 1 : 0 }}
      />

      <Navbar
        title={currentStep.name}
        right={<span className="text-sm text-sub">{stepIndex + 1}/{steps.length}</span>}
        onBack={phase === 'ready' && stepIndex === 0 ? () => navigate('/dev/setup') : undefined}
        showBack={phase === 'ready' && stepIndex === 0}
      />

      {phase === 'running' && (
        <progress className="progress progress-primary w-full h-1 rounded-none" value={overallProgress} max={1} />
      )}

      {phase === 'ready' && currentStep.transitionWarning && (
        <div className="alert alert-error mx-4 mt-3 py-3 px-4">
          <span className="font-semibold text-sm">⚠ {currentStep.transitionWarning}</span>
        </div>
      )}

      {(currentStep.warnings ?? []).map((w, i) => (
        <div key={i} className="alert alert-warning py-2 px-4 text-sm mx-4 mt-3">
          <span>⚠ {w}</span>
        </div>
      ))}

      {/* Center zone — always flex-1, same position */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4">
        {phase === 'ready' && (
          <>
            <p className="text-xs text-sub uppercase">Step {stepIndex + 1} of {steps.length}</p>
            <h2 className="text-xl font-bold">{currentStep.name}</h2>
          </>
        )}
        <span className={`text-8xl font-bold font-mono tabular-nums leading-none transition-colors mt-2 ${phase === 'running' && isAgitationTime ? 'text-warning' : 'text-base-content'}`}>
          {format(remaining)}
        </span>
        {phase === 'running' && (
          <>
            <span className="text-sm text-sub">{format(currentStep.durationSeconds)} total</span>
            <div className="w-full max-w-50 mt-1">
              <progress className="progress progress-primary w-full h-1" value={progress} max={1} />
            </div>
            <button
              className="btn btn-circle btn-lg btn-ghost mt-2"
              onClick={() => setRunning((prev) => !prev)}
              aria-label={isTimerActive ? 'Pause' : 'Resume'}
            >
              {isTimerActive ? <Pause size={28} /> : <Play size={28} />}
            </button>
          </>
        )}
      </div>

      {/* Bottom info — always present */}
      <div className="px-4 pb-2 space-y-2">
        {currentStep.agitation && (
          <div className={`card overflow-hidden ${phase === 'running' && isAgitationTime ? 'bg-warning/10' : 'bg-base-200'}`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${phase === 'running' && isAgitationTime ? 'bg-warning' : 'bg-base-300'}`} />
            <div className="card-body py-3 pl-5 pr-4 flex-row items-start gap-3">
              <Bell size={16} className={`mt-0.5 shrink-0 ${phase === 'running' && isAgitationTime ? 'text-warning' : 'text-sub'}`} />
              <div>
                <p className={`text-sm font-medium ${phase === 'running' && isAgitationTime ? 'text-warning' : ''}`}>
                  {phase === 'running' && isAgitationTime ? '🔔 Time to agitate!' : '🔔 Agitation Reminder'}
                </p>
                <p className="text-xs text-sub">
                  {phase === 'ready'
                    ? `Initial ${currentStep.agitation.initial_seconds}s, then ${currentStep.agitation.duration_seconds}s every ${currentStep.agitation.interval_seconds}s`
                    : `${currentStep.agitation.duration_seconds}s every ${currentStep.agitation.interval_seconds}s`}
                </p>
              </div>
            </div>
          </div>
        )}

        {nextStep && (
          <div className="card bg-base-200">
            <div className="card-body py-3 px-4">
              <p className="text-xs text-sub">Next →</p>
              <p className="text-sm font-medium">{nextStep.name}</p>
              <p className="text-xs text-sub">{format(nextStep.durationSeconds)}</p>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2 py-1">
          {steps.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i < stepIndex ? 'bg-primary w-2' : i === stepIndex ? 'bg-primary w-4' : 'bg-base-300 w-2'}`} />
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-base-300">
        {phase === 'ready' ? (
          <button className="btn btn-primary w-full btn-lg" onClick={startStep}>
            <Play size={20} /> Start Timer
          </button>
        ) : (
          <>
            <button className="btn btn-primary w-full" onClick={advanceOrDone} disabled={remaining > 0}>
              {stepIndex + 1 >= steps.length ? 'Complete session 🎉' : 'Next step →'}
            </button>
            {!isTimerActive && (
              <p className="text-xs text-center text-sub mt-2">
                or{' '}
                <button className="underline" onClick={() => setManualExitModal(true)}>
                  exit session
                </button>
              </p>
            )}
          </>
        )}
      </div>

      <ConfirmLeaveModal
        open={showExitModal}
        title="⚠️ Exit session?"
        message="Film is still in the chemical — leaving mid-session may damage the film."
        confirmLabel="Exit session"
        cancelLabel="Stay"
        danger
        onConfirm={() => {
          setManualExitModal(false)
          sentinelRef.current = false
          setPhase('ready')
          setRunning(false)
          setPendingNavigateHome(true)
        }}
        onCancel={() => {
          setManualExitModal(false)
          // sentinel is still in history — back button remains blocked
        }}
      />
    </div>
  )
}
