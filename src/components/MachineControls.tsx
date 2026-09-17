import type { Dispatch, RefObject } from 'react'
import type { AppAction } from '../app/state'
import { DURATION_DEFINITIONS, THEMES } from '../domain/config'
import type { DurationMinutes, Preferences, ThemeId } from '../domain/types'

export function MachineControls({ preferences, disabled, dispatch, deckRef }: { preferences: Preferences; disabled: boolean; dispatch: Dispatch<AppAction>; deckRef: RefObject<HTMLDivElement | null> }) {
  const bookendMinutes = DURATION_DEFINITIONS[preferences.durationMinutes].bookendMinutes
  return <div className="control-deck" ref={deckRef} tabIndex={-1} aria-label="Workout settings">
    <fieldset disabled={disabled} className="duration-control"><legend>Session minutes</legend><div className="segmented">
      {([15, 30, 45, 60] as DurationMinutes[]).map(durationMinutes => <button key={durationMinutes} aria-pressed={preferences.durationMinutes === durationMinutes} onClick={() => dispatch({ type: 'preferences', patch: { durationMinutes } })}>{durationMinutes}<span className="sr-only"> min</span></button>)}
    </div></fieldset>
    <fieldset disabled={disabled} className="bookend-controls"><legend className="sr-only">Bookends</legend>
      {(['warmup', 'cooldown'] as const).map(kind => { const key = kind === 'warmup' ? 'includeWarmup' : 'includeCooldown'; return <label key={kind}>
        <span>{kind === 'warmup' ? 'Warm-up' : 'Cool-down'} <small>{bookendMinutes} min</small></span>
        <input type="checkbox" checked={preferences[key]} onChange={event => dispatch({ type: 'preferences', patch: { [key]: event.target.checked } })} />
        <span className="rocker" aria-hidden="true">{preferences[key] ? 'ON' : 'OFF'}</span>
      </label> })}
    </fieldset>
    <fieldset disabled={disabled} className="finish-control"><legend>Cabinet finish</legend><div className="segmented">
      {(Object.keys(THEMES) as ThemeId[]).map(theme => <button key={theme} aria-pressed={preferences.theme === theme} onClick={() => dispatch({ type: 'preferences', patch: { theme } })}>{THEMES[theme].label}</button>)}
    </div></fieldset>
  </div>
}
