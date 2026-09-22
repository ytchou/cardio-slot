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
  useEffect(() => {
    if (!state.requestId) return
    const next = state.flow === 'spinning'
      ? { flow: 'printing' as const, delay: 4_000 }
      : state.flow === 'printing'
        ? { flow: 'opening' as const, delay: 850 }
        : null
    if (!next) return
    const timer = window.setTimeout(() => dispatch({ type: 'sequence', requestId: state.requestId, flow: next.flow }), reduced ? 0 : next.delay)
    return () => window.clearTimeout(timer)
  }, [state.flow, state.requestId, dispatch, reduced])
}
