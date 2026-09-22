import { act, renderHook } from '@testing-library/react'
import { useReducer } from 'react'
import { generateWorkout } from '../domain/workout'
import { appReducer, createInitialState } from './state'
import { useMachineSequence } from './useMachineSequence'

const plan = generateWorkout({ durationMinutes: 15, includeWarmup: true, includeCooldown: true }, 24680)

function useSequenceHarness(reduced = false) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => appReducer(createInitialState(null), { type: 'pull', plan, requestId: 1 }))
  useMachineSequence(state, dispatch, reduced)
  return state.flow
}

describe('Given a runner pulls the machine', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('completes the reel and print stages in order without opening the ticket early', () => {
    const { result } = renderHook(() => useSequenceHarness())

    act(() => vi.advanceTimersByTime(3_999))
    expect(result.current).toBe('spinning')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('printing')

    act(() => vi.advanceTimersByTime(849))
    expect(result.current).toBe('printing')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('opening')

    act(() => vi.advanceTimersByTime(1_000))
    expect(result.current).toBe('opening')
  })

  it('skips both timed stages when reduced motion is requested', () => {
    const { result } = renderHook(() => useSequenceHarness(true))

    act(() => vi.runOnlyPendingTimers())
    expect(result.current).toBe('printing')

    act(() => vi.runOnlyPendingTimers())
    expect(result.current).toBe('opening')
  })
})
