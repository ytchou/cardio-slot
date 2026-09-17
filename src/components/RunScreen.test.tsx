import { render, screen } from '@testing-library/react'
import { createInitialState } from '../app/state'
import { getRunSnapshot } from '../domain/runtime'
import { generateWorkout } from '../domain/workout'
import { RunScreen } from './RunScreen'

describe('Given the browser reports screen wake-lock state', () => {
  it('only shows guidance when automatic display lock is unavailable', () => {
    const plan = generateWorkout({ durationMinutes: 15, includeWarmup: true, includeCooldown: true }, 42)
    const activeRun = { plan, startTimestamp: 0 }
    const state = { ...createInitialState(null, 1_000), flow: 'running' as const, activeRun, now: 1_000 }
    const snapshot = getRunSnapshot(plan, activeRun.startTimestamp, state.now)
    const props = { state, snapshot, reduced: false, dispatch: () => undefined }
    const { rerender } = render(<RunScreen {...props} wake="inactive" />)

    expect(screen.queryByText(/screen|wake lock/i)).not.toBeInTheDocument()
    rerender(<RunScreen {...props} wake="active" />)
    expect(screen.queryByText(/screen|wake lock/i)).not.toBeInTheDocument()

    for (const wake of ['denied', 'unsupported'] as const) {
      rerender(<RunScreen {...props} wake={wake} />)
      expect(screen.getByText('Keep your screen on — automatic display lock is unavailable.')).toBeVisible()
    }
  })
})
