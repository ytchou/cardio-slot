import { useEffect, useState, type Dispatch } from 'react'
import type { AppAction, AppState } from './state'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const changed = () => setReduced(query.matches)
    query.addEventListener('change', changed)
    return () => query.removeEventListener('change', changed)
  }, [])
  return reduced
}

export function useMachineSequence(state: AppState, dispatch: Dispatch<AppAction>, reduced: boolean) {
  const accepted = state.requestId
  useEffect(() => {
    if (!accepted) return
    const timers = ([['printing', 2470], ['opening', 3070], ['ticket', 3570]] as const).map(([flow, delay]) =>
      window.setTimeout(() => dispatch({ type: 'sequence', requestId: accepted, flow }), reduced ? 0 : delay))
    return () => timers.forEach(window.clearTimeout)
  }, [accepted, dispatch, reduced])
}
