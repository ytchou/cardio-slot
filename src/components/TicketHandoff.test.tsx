import { createRef } from 'react'
import { waitFor } from '@testing-library/react'
import { generateWorkout } from '../domain/workout'
import { renderWithI18n as render } from '../test/render'
import { TicketHandoff } from './TicketHandoff'

const plan = generateWorkout({ durationMinutes: 15, includeWarmup: true, includeCooldown: true }, 13579)

describe('Given ticket motion is unavailable', () => {
  it('settles the handoff instead of leaving the machine blocked', async () => {
    const onSettled = vi.fn()
    const { queryByRole } = render(<TicketHandoff plan={plan} paperRef={createRef<HTMLDivElement>()} reduced={false} onSettled={onSettled} />)

    expect(queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(onSettled).toHaveBeenCalledOnce())
  })
})
