// pages/develop/ActiveTimerPage.tsx — 04 · Active Timer
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pause, Play, Bell } from 'lucide-react'
import ConfirmLeaveModal from '../../components/ConfirmLeaveModal'
import { useDevelopStore } from '../../store/developStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useTimer, formatTime } from '../../hooks/useTimer'

export default function ActiveTimerPage() {
  const navigate = useNavigate()
  const {
    recipe, currentStepIndex, timerState, remainingSeconds,
    pauseTimer, resumeTimer, exitSession, effectiveDuration,
    slotSelections,
  } = useDevelopStore()
  const { sound, vibrate, screenFlash } = useSettingsStore()
  const [showExitModal, setShowExitModal] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)
  const prevAgitationRef = useRef(false)

  // Run the timer interval
  useTimer()

  // Block browser back button while timer is running or paused.
  // useBlocker requires a data router (createBrowserRouter) which we don't use,
  // so we implement back-prevention manually via popstate.
  useEffect(() => {
    const isActive = timerState === 'running' || timerState === 'paused'
    if (!isActive) return

    // Push a dummy history entry so "back" returns here instead of leaving
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      if (timerState === 'running' || timerState === 'paused') {
        // Re-push so back stays trapped
        window.history.pushState(null, '', window.location.href)
        setShowExitModal(true)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [timerState])

  // Compute agitation state early so the effect below can use it
  // (must come before early return to satisfy Rules of Hooks)
  const _recipe = recipe
  const _step = _recipe?.develop_steps[currentStepIndex]
  const _agitation = _step?.agitation
  const _totalSeconds = _recipe && _step
    ? effectiveDuration(_step)
    : 0
  const _timeElapsed = _totalSeconds - remainingSeconds
  const _isAgitationTime = !!(_agitation && _timeElapsed > 0 && (
    _timeElapsed <= _agitation.initial_seconds ||
    (_timeElapsed - _agitation.initial_seconds) % _agitation.interval_seconds <
      _agitation.duration_seconds
  ))

  // Fire reminders when agitation window starts
  useEffect(() => {
    const justStarted = _isAgitationTime && !prevAgitationRef.current
    prevAgitationRef.current = _isAgitationTime

    if (!justStarted) return

    if (sound) {
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.4)
      } catch { /* ignore if AudioContext unavailable */ }
    }

    if (vibrate && navigator.vibrate) {
      navigator.vibrate([200, 100, 200])
    }

    if (screenFlash) {
      setIsFlashing(true)
      setTimeout(() => setIsFlashing(false), 300)
    }
  }, [_isAgitationTime, sound, vibrate, screenFlash])

  // Guard: no recipe, or timer was never started (e.g. direct nav / page refresh)
  if (!recipe || timerState === 'idle') {
    navigate('/')
    return null
  }

  const step = recipe.develop_steps[currentStepIndex]

  // ถ้า step เป็น stop bath แต่ไม่มีขวด chemical stop เลือกอยู่ → แสดง water stop note
  const isStopStep = step.type === 'stop'
  const stopSlotEmpty = isStopStep && !slotSelections[step.id]
  const totalSeconds = _totalSeconds
  const progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0
  const isRunning = timerState === 'running'
  const isComplete = timerState === 'complete'

  const nextStep = recipe.develop_steps[currentStepIndex + 1]
  const stepsDots = recipe.develop_steps.filter(
    (s) => s.duration_seconds !== 'variable'
  )

  const agitation = _agitation
  const isAgitationTime = _isAgitationTime

  function handleNext() {
    if (currentStepIndex + 1 >= recipe!.develop_steps.length) {
      exitSession()
      navigate('/develop/done')
    } else {
      navigate('/develop/step-complete')
    }
  }

  function handleExit() {
    exitSession()
    navigate('/')
  }

  return (
    <div className="flex flex-col h-full bg-base-100 relative">
      {/* Screen flash overlay */}
      {isFlashing && (
        <div className="absolute inset-0 z-50 bg-warning/40 pointer-events-none animate-pulse" />
      )}
      {/* Navbar — no back button when timer running */}
      <div className="navbar bg-base-200/80 backdrop-blur-sm sticky top-0 z-30 border-b border-base-300 min-h-[56px] px-4">
        <div className="navbar-start w-10">
          {timerState === 'paused' && (
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => setShowExitModal(true)}
              aria-label="Exit"
            >
              ✕
            </button>
          )}
        </div>
        <div className="navbar-center flex flex-col items-center">
          <span className="font-semibold text-base">{step.name}</span>
        </div>
        <div className="navbar-end w-16">
          <span className="text-sm text-sub">
            {Math.min(currentStepIndex + 1, stepsDots.length)}/{stepsDots.length}
          </span>
        </div>
      </div>

      {/* Step progress bar */}
      <progress
        className="progress progress-primary w-full h-1 rounded-none"
        value={progress}
        max={1}
      />

      <div className="flex-1 min-h-0 flex flex-col px-4 pb-24 pt-2">
        {/* Warning banner */}
        {step.warnings?.map((w, i) => (
          <div key={i} className="alert alert-error py-2 px-4 text-sm mb-3 mt-2">
            <span>⚠ {w}</span>
          </div>
        ))}

        {/* Water stop fallback note */}
        {stopSlotEmpty && (
          <div className="flex items-start gap-3 bg-base-200 border-l-4 border-primary/60 rounded-xl py-2 px-4 text-sm mb-3 mt-2">
            <span>💧 No chemical stop selected — use water rinse instead (30–60 sec, continuous agitation)</span>
          </div>
        )}

        {/* Timer display */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 py-4">
          <span className={`text-8xl font-bold font-mono tabular-nums ${isAgitationTime ? 'text-warning' : 'text-base-content'}`}>
            {formatTime(remainingSeconds)}
          </span>
          <span className="text-sm text-sub">
            remaining / {step.name} {formatTime(totalSeconds)} min
          </span>

          {/* Progress bar for current step */}
          <div className="w-full mt-1">
            <progress
              className="progress progress-primary w-full h-1"
              value={progress}
              max={1}
            />
          </div>

          {/* Agitation reminder card */}
          {agitation && (
            <div className={`card w-full mt-2 overflow-hidden ${isAgitationTime ? 'bg-warning/10' : 'bg-base-200'}`}>
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isAgitationTime ? 'bg-warning' : 'bg-base-300'}`} />
              <div className="card-body py-3 pl-5 pr-4 flex-row items-start gap-3">
                <Bell size={16} className={`mt-0.5 shrink-0 ${isAgitationTime ? 'text-warning' : 'text-sub'}`} />
                <div>
                  <p className={`text-sm font-medium ${isAgitationTime ? 'text-warning' : ''}`}>
                    {isAgitationTime ? '🔔 Time to agitate!' : '🔔 Agitation Reminder'}
                  </p>
                  <p className="text-xs text-sub">
                    Agitate {agitation.duration_seconds}s every {agitation.interval_seconds}s
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pause button */}
          <button
            className="btn btn-circle btn-lg btn-ghost mt-2"
            onClick={isRunning ? pauseTimer : resumeTimer}
            aria-label={isRunning ? 'Pause' : 'Resume'}
          >
            {isRunning ? <Pause size={28} /> : <Play size={28} />}
          </button>

          {/* Next step preview */}
          {nextStep && (
            <div className="card bg-base-200 w-full">
              <div className="card-body py-3 px-4">
                <p className="text-xs text-sub">Next →</p>
                <p className="text-sm font-medium">{nextStep.name}</p>
                {nextStep.duration_seconds !== 'variable' && (
                  <p className="text-xs text-sub">
                    {formatTime(effectiveDuration(nextStep))} min
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step dots */}
          <div className="flex gap-1.5 mt-2">
            {stepsDots.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < currentStepIndex
                    ? 'bg-primary'
                    : i === currentStepIndex
                    ? 'bg-primary w-4'
                    : 'bg-base-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-base-100/90 backdrop-blur-sm border-t border-base-300">
        <button
          className="btn btn-primary w-full btn-lg"
          disabled={!isComplete && timerState !== 'paused'}
          onClick={handleNext}
        >
          {nextStep ? `Next step →` : 'All done 🎉'}
        </button>
        {(timerState === 'paused') && (
          <p className="text-xs text-center text-muted mt-1">
            or <button className="underline" onClick={() => setShowExitModal(true)}>exit session</button>
          </p>
        )}
      </div>

      {/* Confirm exit */}
      <ConfirmLeaveModal
        open={showExitModal}
        title="⚠️ Exit session?"
        message="Film is still in the chemical — leaving mid-session may damage the film"
        confirmLabel="Exit — go to home"
        cancelLabel="Stay"
        danger
        onConfirm={handleExit}
        onCancel={() => setShowExitModal(false)}
      />
    </div>
  )
}
