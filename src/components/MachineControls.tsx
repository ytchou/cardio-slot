import type { Dispatch, RefObject } from 'react'
import type { AppAction } from '../app/state'
import type { DurationMinutes, Preferences } from '../domain/types'
import { useI18n } from '../i18n'

export function MachineControls({ preferences, disabled, dispatch, deckRef }: { preferences: Preferences; disabled: boolean; dispatch: Dispatch<AppAction>; deckRef: RefObject<HTMLDivElement | null> }) {
  const { t } = useI18n()
  return <div className="control-deck" ref={deckRef} tabIndex={-1} aria-label={t('machine.settings')}>
    <fieldset disabled={disabled} className="duration-control"><legend className="sr-only">{t('machine.sessionMinutes')}</legend><span className="duration-label" aria-hidden="true">{t('machine.sessionMinutes')}</span><div className="segmented">
      {([15, 30, 60] as DurationMinutes[]).map(durationMinutes => <button key={durationMinutes} aria-pressed={preferences.durationMinutes === durationMinutes} onClick={() => dispatch({ type: 'preferences', patch: { durationMinutes } })}>{durationMinutes}<span className="sr-only"> {t('machine.minutes')}</span></button>)}
    </div></fieldset>
    <fieldset disabled={disabled} className="bookend-controls"><legend className="sr-only">{t('machine.bookends')}</legend>
      {(['warmup', 'cooldown'] as const).map(kind => { const key = kind === 'warmup' ? 'includeWarmup' : 'includeCooldown'; return <label key={kind}>
        <span>{t(kind === 'warmup' ? 'machine.includeWarmup' : 'machine.cooldownExercise')}</span>
        <input type="checkbox" checked={preferences[key]} onChange={event => dispatch({ type: 'preferences', patch: { [key]: event.target.checked } })} />
        <span className="rocker" aria-hidden="true">{t(preferences[key] ? 'machine.on' : 'machine.off')}</span>
      </label> })}
    </fieldset>
  </div>
}
