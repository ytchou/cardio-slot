import type { ReactNode } from 'react'
import { TEMPLATE_TYPES } from '../domain/config'
import type { WorkoutPlan } from '../domain/types'
import { templateLabel, useI18n } from '../i18n'
import { ReelStrip } from './ReelStrip'

export function ReelMachine({ busy, spinning, attention, plan, requestId, reduced, pull, children }: { busy: boolean; spinning: boolean; attention: boolean; plan: WorkoutPlan | null; requestId: number; reduced: boolean; pull: () => void; children: ReactNode }) {
  const { locale, t } = useI18n()
  const markLabels = TEMPLATE_TYPES.map(template => `${template}-mark`)
  const registries = [markLabels.map(id => ({ id, label: id })), TEMPLATE_TYPES.map(id => ({ id, label: templateLabel(locale, id) })), markLabels.map(id => ({ id, label: id }))]
  const templateType = plan?.templateType ?? 'endurance'
  const values = [`${templateType}-mark`, templateType, `${templateType}-mark`]
  return <section className="cabinet" aria-label={t('machine.slot')}>
    <header className="marquee"><i aria-hidden="true" /><h1>CARDIO SLOT</h1><i aria-hidden="true" /></header>
    <div className="reel-bay">
      <div className="reels">{registries.map((items, index) => <ReelStrip key={index} items={items} value={values[index] ?? ''} index={index} requestId={requestId} reduced={reduced} spinning={spinning} />)}</div>
    </div>
    <div className="sr-only" role="status">{!busy && plan ? t('machine.selected', { type: templateLabel(locale, plan.templateType) }) : spinning ? t('machine.reelsRolling') : ''}</div>
    <div className={`lever-rail ${attention ? 'is-ready' : ''}`}><span className="lever-caption">{t('machine.pullPrompt')}</span><span className="lever-bracket" aria-hidden="true" />
      <button className={`lever ${spinning && !reduced ? 'is-pulling' : ''}`} disabled={busy} onClick={pull} aria-label={t('machine.pull')}><span className="lever-rod" /><span className="lever-ball" /><span className="lever-pivot" /></button>
    </div>
    {children}
  </section>
}
