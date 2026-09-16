import { FINISH_LABELS, FOCUS_LABELS, PATTERN_LABELS } from '../domain/config'
import type { WorkoutPlan } from '../domain/types'

interface ReelMachineProps {
  spinning: boolean
  plan: WorkoutPlan | null
}

const idleValues = ['FOCUS', 'PATTERN', 'FINISH']

export function ReelMachine({ spinning, plan }: ReelMachineProps) {
  const values = plan
    ? [FOCUS_LABELS[plan.focus], PATTERN_LABELS[plan.pattern], FINISH_LABELS[plan.finish]]
    : idleValues
  return (
    <div className={`reel-machine ${spinning ? 'is-spinning' : ''}`} aria-label="Workout reels" aria-live="polite">
      {values.map((value, index) => (
        <div className="reel-window" key={idleValues[index]}>
          <span className="reel-value">{spinning ? ['HILLS', 'WAVES', 'SPRINT'][index] : value}</span>
        </div>
      ))}
    </div>
  )
}

