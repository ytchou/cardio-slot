import { screen, within } from '@testing-library/react'
import { generateWorkout } from '../domain/workout'
import { renderWithI18n as render } from '../test/render'
import { Ticket } from './Ticket'

it('prints every workout interval without opening sections', () => {
  const plan = generateWorkout({ durationMinutes: 30, includeWarmup: true, includeCooldown: true }, 86_753)
  const intervalCount = plan.blocks.reduce((count, block) => count + block.intervals.length, 0)

  render(<Ticket plan={plan} />)

  expect(screen.getAllByRole('list', { name: 'Intervals' })).toHaveLength(plan.blocks.length)
  expect(screen.getAllByRole('listitem')).toHaveLength(intervalCount)
  expect(screen.queryByRole('button', { name: /Block \d+ of/ })).not.toBeInTheDocument()
  expect(screen.getByText('Full sentences')).toBeVisible()
  expect(screen.queryByText(/Go at your own pace/)).not.toBeInTheDocument()
  const mainBlocks = plan.blocks.filter(block => block.kind === 'main')
  for (const [index] of mainBlocks.entries()) {
    const block = screen.getByRole('region', { name: `Block ${index + 1} of ${mainBlocks.length}` })
    expect(within(block).getByText(String(index + 1).padStart(2, '0'), { exact: true })).toBeVisible()
  }
})

it('shows the scheduled incline in the recovery row', () => {
  const plan = generateWorkout({ durationMinutes: 15, includeWarmup: false, includeCooldown: false }, 86_753)
  const recovery = plan.blocks.find(block => block.kind === 'recovery')
  const incline = recovery?.intervals.at(0)?.incline
  if (incline === undefined) throw new Error('Expected a recovery interval')

  render(<Ticket plan={plan} />)
  expect(screen.getByText('Duration: 15 min')).toBeInTheDocument()
  for (const recoveryRow of screen.getAllByRole('region', { name: 'Recovery' })) {
    expect(within(recoveryRow).getByText(`Incline ${incline}%`)).toBeInTheDocument()
  }
})
