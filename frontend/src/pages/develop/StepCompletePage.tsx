// pages/develop/StepCompletePage.tsx — 05 · Step Complete
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Navbar from '../../components/Navbar'
import ConfirmLeaveModal from '../../components/ConfirmLeaveModal'
import { useDevelopStore } from '../../store/developStore'
import { formatTime } from '../../hooks/useTimer'

export default function StepCompletePage() {
  const navigate = useNavigate()
  const { recipe, currentStepIndex, timerState, exitSession, completeStep, effectiveDuration } = useDevelopStore()
  const [showExitModal, setShowExitModal] = useState(false)

  // Guard: no recipe, or session was never active (direct nav / page refresh)
  if (!recipe || timerState === 'idle') { navigate('/'); return null }

  const step = recipe.develop_steps[currentStepIndex]
  const nextStep = recipe.develop_steps[currentStepIndex + 1]
  const isLast = !nextStep

  function handleNext() {
    completeStep()
    navigate('/develop/timer')
  }

  return (
    <div className="flex flex-col h-full">
      {/* No back button — see BACK_BUTTON_POLICY.md */}
      <Navbar title={`${step.name} — done`} showBack={false} />

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center px-4 pb-24 pt-8">
        {/* Success icon */}
        <CheckCircle2 size={80} className="text-success mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-bold mb-1">{step.name} done!</h2>

        {/* Transition warning */}
        {step.transition_warning && (
          <div className="alert alert-warning w-full mt-4 mb-2">
            <span className="text-sm">⚠ {step.transition_warning}</span>
          </div>
        )}

        {/* Next step preview */}
        {nextStep && (
          <div className="w-full mt-4">
            <p className="text-xs text-sub uppercase tracking-widest mb-2">Next step</p>
            <div className="card bg-base-200 w-full">
              <div className="card-body py-4 px-5 flex-row items-center gap-3">
                <div className="w-1 self-stretch bg-primary rounded-full" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{nextStep.name}</p>
                  {nextStep.duration_seconds !== 'variable' && (
                    <p className="text-xs text-sub">
                      {formatTime(effectiveDuration(nextStep))} min
                    </p>
                  )}
                  {nextStep.warnings?.[0] && (
                    <p className="text-xs text-warning mt-1">⚠ {nextStep.warnings[0]}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Emergency exit */}
        <button
          className="btn btn-ghost btn-sm text-muted mt-6"
          onClick={() => setShowExitModal(true)}
        >
          Exit session
        </button>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-base-100/90 backdrop-blur-sm border-t border-base-300">
        {isLast ? (
          <button className="btn btn-success w-full btn-lg" onClick={() => { exitSession(); navigate('/develop/done') }}>
            All steps complete 🎉
          </button>
        ) : (
          <button className="btn btn-primary w-full btn-lg" onClick={handleNext}>
            Start {nextStep.name} →
          </button>
        )}
      </div>

      <ConfirmLeaveModal
        open={showExitModal}
        title="⚠️ Exit session?"
        message="Film may still be in the chemical — leaving mid-session may damage the film"
        confirmLabel="Exit — go to home"
        cancelLabel="Stay"
        danger
        onConfirm={() => { exitSession(); navigate('/') }}
        onCancel={() => setShowExitModal(false)}
      />
    </div>
  )
}
