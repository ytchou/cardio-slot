import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MachineControls } from '../components/MachineControls'
import { translate } from './catalog'
import { I18nProvider, useI18n } from './I18n'

function Probe() {
  const { locale, setLocale, t } = useI18n()
  return <><span>{locale}</span><span>{t('ticket.start')}</span><button onClick={() => setLocale('zh-TW')}>switch</button></>
}

describe('Given a manual locale change, every consumer receives the new catalog', () => {
  it('updates rendered copy and persists the explicit override', async () => {
    localStorage.clear()
    render(<I18nProvider initialLocale="en"><Probe /></I18nProvider>)
    expect(screen.getByText('Start workout')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'switch' }))
    expect(screen.getByText('開始訓練')).toBeVisible()
    expect(localStorage.getItem('cardio-slot-locale')).toBe('zh-TW')
    expect(document.documentElement.lang).toBe('zh-TW')
  })
})

it('uses action-oriented Traditional Chinese labels for machine settings', () => {
  render(<I18nProvider initialLocale="zh-TW"><MachineControls
    preferences={{ durationMinutes: 30, includeWarmup: true, includeCooldown: false, theme: 'track' }}
    disabled={false} dispatch={vi.fn()} deckRef={createRef<HTMLDivElement>()}
  /></I18nProvider>)

  expect(screen.getAllByText('運動長度')).toHaveLength(2)
  expect(screen.queryByText('45')).not.toBeInTheDocument()
  expect(screen.getByText('加入暖身')).toBeVisible()
  expect(screen.getByText('緩和運動')).toBeVisible()
  expect(screen.getByText('ON')).toBeVisible()
  expect(screen.getByText('OFF')).toBeVisible()
  expect(translate('zh-TW', 'machine.pullPrompt')).toBe('開始')
  expect(translate('zh-TW', 'effort.strong')).toBe('衝刺')
  expect(translate('zh-TW', 'ticket.duration', { clock: '30:00', minutes: 30 })).toBe('訓練時間：30 分鐘')
  expect(translate('zh-TW', 'ticket.pullAgain')).toBe('重新選擇')
  expect(translate('en', 'ticket.heading', { type: 'SPEED' })).toBe('Workout of the day: SPEED')
  expect(translate('en', 'ticket.duration', { clock: '30:00', minutes: 30 })).toBe('Duration: 30 min')
})
