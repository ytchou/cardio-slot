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

describe('Given a generated workout is running', () => {
  it('shows every interval in the workout map in canonical order with useful progress text', () => {
    const plan = generateWorkout({ durationMinutes: 15, includeWarmup: true, includeCooldown: true }, 86_753)
    const activeRun = { plan, startTimestamp: 0 }
    const state = { ...createInitialState(null, 61_000), flow: 'running' as const, activeRun, now: 61_000 }
    const snapshot = getRunSnapshot(plan, activeRun.startTimestamp, state.now)
    const { container } = render(<RunScreen state={state} snapshot={snapshot} reduced={false} dispatch={() => undefined} wake="active" />)
    const expectedIds = plan.blocks.flatMap(block => block.intervals.map(interval => interval.id))
    const mapIds = Array.from(container.querySelectorAll('[data-workout-map] [data-interval-id]'), element => element.getAttribute('data-interval-id'))

    expect(mapIds).toEqual(expectedIds)
    expect(container.querySelector('.workout-map-interval.is-current')).toHaveAttribute('data-interval-id', snapshot.currentInterval?.id)
    expect(screen.getByRole('progressbar', { name: 'Workout progress' })).toHaveAttribute('aria-valuemax', '900')
    expect(screen.getByRole('progressbar', { name: 'Workout progress' })).toHaveAttribute('aria-valuenow', '61')
    expect(screen.getByRole('progressbar', { name: 'Workout progress' })).toHaveAttribute('aria-valuetext', expect.stringContaining('remaining in this interval'))
    expect(screen.getByRole('button', { name: 'End session' })).toBeVisible()
  })

  it('emphasizes the fixed next cue during the final five seconds without changing its contents', () => {
    const plan = generateWorkout({ durationMinutes: 15, includeWarmup: true, includeCooldown: true }, 86_753)
    const first = plan.blocks.at(0)?.intervals.at(0)
    if (!first) throw new Error('Expected the generated workout to contain an interval')
    const elapsedSeconds = first.durationSeconds - 4
    const activeRun = { plan, startTimestamp: 0 }
    const state = { ...createInitialState(null, elapsedSeconds * 1_000), flow: 'running' as const, activeRun, now: elapsedSeconds * 1_000 }
    const snapshot = getRunSnapshot(plan, activeRun.startTimestamp, state.now)
    render(<RunScreen state={state} snapshot={snapshot} reduced={false} dispatch={() => undefined} wake="active" />)

    const nextPanel = screen.getByText('NEXT IN 4…').closest('.next-panel')
    expect(nextPanel).toBeVisible()
    expect(nextPanel).toHaveTextContent(snapshot.nextInterval ? intervalLabel(snapshot.nextInterval.intensity) : 'FINISH')
  })
})

function intervalLabel(intensity: 'easy' | 'strong' | 'max' | 'recovery') {
  return intensity === 'recovery' ? 'Walk / Easy' : intensity[0].toUpperCase() + intensity.slice(1)
}
