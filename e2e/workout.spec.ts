import { expect, test, type Page } from '@playwright/test'

async function pullWorkout(page: Page) {
  await page.getByRole('button', { name: /^(Pull workout|Pull again)$/ }).click()
  await page.clock.runFor(3650)
  await expect(page.getByRole('dialog', { name: 'Your workout ticket' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start workout' })).toBeEnabled()
}
async function saved(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('cardio-slot-state-v2') ?? 'null'))
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-17T06:00:00Z') })
  await page.goto('./')
})

test('Given settings and a ticket, edits invalidate the preview and every instruction matches the run', async ({ page }) => {
  for (const theme of ['Track', 'Neon', 'Mono']) {
    await page.getByRole('button', { name: theme, exact: true }).click()
    await expect(page.getByRole('button', { name: theme, exact: true })).toHaveAttribute('aria-pressed', 'true')
  }
  await page.getByRole('button', { name: '15 min', exact: true }).click()
  await page.getByLabel(/Warm-up/).uncheck()
  await page.getByLabel(/Cool-down/).uncheck()
  await page.reload()
  await expect(page.getByLabel(/Warm-up/)).not.toBeChecked()
  await expect(page.getByRole('button', { name: 'Mono', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await pullWorkout(page)
  const ticket = page.getByRole('dialog', { name: 'Your workout ticket' })
  await expect(ticket.locator('.ticket-duration')).toContainText('15:00')
  const first = await saved(page)
  const ids = first.currentTicket.blocks.flatMap((block: { intervals: { id: string }[] }) => block.intervals.map(interval => interval.id))
  expect(await page.locator('[data-interval-id]').evaluateAll(elements => elements.map(element => element.getAttribute('data-interval-id')))).toEqual(ids)
  const phaseButtons = ticket.locator('.ticket-phase-toggle')
  await expect(phaseButtons).toHaveCount(first.currentTicket.blocks.length)
  await expect(ticket.locator('.ticket-effort-strip')).toHaveCount(first.currentTicket.blocks.length)
  await expect(ticket.locator('[role="region"]:not([hidden])')).toHaveCount(1)
  await expect(phaseButtons.first()).toContainText(/\d+ intervals? ·/)
  await expect(ticket.getByRole('button', { name: /Block 1 of/ })).toHaveAttribute('aria-expanded', 'true')
  const nextPhase = phaseButtons.nth(1)
  await nextPhase.click()
  await expect(nextPhase).toHaveAttribute('aria-expanded', 'true')
  await expect(ticket.getByRole('button', { name: /Block 1 of/ })).toHaveAttribute('aria-expanded', 'false')
  await nextPhase.press('ArrowDown')
  await expect(phaseButtons.nth(2)).toBeFocused()
  expect(await ticket.locator('.ticket-body').evaluate(body => {
    const callout = body.querySelector('.ticket-safety')
    const firstPhase = body.querySelector('.ticket-phase')
    return Boolean(callout && firstPhase && callout.compareDocumentPosition(firstPhase) & Node.DOCUMENT_POSITION_FOLLOWING)
  })).toBe(true)
  await expect(ticket.getByText(/Seed [A-F0-9]{8}/)).toHaveCount(0)
  await expect(ticket.getByText(/main blocks · Incline/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Close ticket' }).click()
  await page.getByRole('button', { name: 'Track', exact: true }).click()
  expect((await saved(page)).currentTicket.id).toBe(first.currentTicket.id)
  await page.getByRole('button', { name: 'View ticket' }).click()
  await page.getByRole('button', { name: 'Close ticket' }).click()
  await expect(page.getByRole('button', { name: 'View ticket' })).toBeFocused()
  await page.getByRole('button', { name: 'View ticket' }).click()
  await page.getByRole('button', { name: 'Adjust settings' }).click()
  await expect(page.getByLabel('Workout settings')).toBeFocused()
  await page.getByLabel(/Warm-up/).check()
  await expect(page.getByRole('button', { name: 'View ticket' })).toHaveCount(0)
  await page.getByLabel(/Warm-up/).uncheck()
  await expect(page.getByRole('button', { name: 'View ticket' })).toHaveCount(0)
  await pullWorkout(page)
  expect((await saved(page)).currentTicket.seed).not.toBe(first.currentTicket.seed)
  await page.getByRole('button', { name: 'Start workout' }).click()
  await page.clock.runFor(5200)
  await expect(page.getByText(/^Block 1 of \d+$/)).toBeVisible()
  await page.clock.fastForward(65000)
  await page.clock.resume()
  await page.getByRole('button', { name: 'End workout', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, end' }).click()
  await expect(page.getByRole('heading', { name: 'SESSION ENDED' })).toBeVisible()
  const result = (await saved(page)).latestResult.summary
  expect(result.elapsedSeconds).toBeGreaterThanOrEqual(65)
  expect(result.elapsedSeconds).toBeLessThan(72)
  await expect(page.getByRole('img', { name: 'Shareable workout result preview' })).toHaveJSProperty('naturalWidth', 1080)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /^(Save|Download) PNG$/ }).click()
  expect((await download).suggestedFilename()).toBe('cardio-slot-ended.png')
  await expect(page.getByRole('status')).toHaveText('PNG downloaded.')
})

test('Given a completed session, Pull another clears the old ticket and runs the full sequence to a different workout', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(crypto, 'getRandomValues', { configurable: true, value: (values: Uint32Array) => { values[0] = 10; return values } })
    const revoke = URL.revokeObjectURL.bind(URL)
    Object.assign(window, { revokedResultUrls: [] as string[] })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: (url: string) => {
      ;(window as unknown as { revokedResultUrls: string[] }).revokedResultUrls.push(url)
      revoke(url)
    } })
  })
  await page.getByRole('button', { name: '15 min', exact: true }).click()
  await pullWorkout(page)
  await page.getByRole('button', { name: 'Start workout' }).click()
  await page.clock.runFor(5_500)
  await page.clock.fastForward(900_000)
  await expect(page.getByRole('heading', { name: 'COMPLETED' })).toBeVisible()
  const completed = (await saved(page)).latestResult.plan
  const previewUrl = await page.getByRole('img', { name: 'Shareable workout result preview' }).getAttribute('src')

  await page.getByRole('button', { name: 'Pull another' }).click()
  await expect(page.getByRole('button', { name: 'View ticket' })).toHaveCount(0)
  await expect.poll(() => page.evaluate(url => (window as unknown as { revokedResultUrls: string[] }).revokedResultUrls.includes(url ?? ''), previewUrl)).toBe(true)
  await page.getByRole('button', { name: 'Pull workout' }).click()
  await expect(page.getByRole('button', { name: 'Pull workout' })).toBeDisabled()
  await expect(page.getByRole('status')).toHaveText('Reels rolling')
  await page.clock.runFor(3_000)
  await expect(page.getByRole('dialog', { name: 'Your workout ticket' })).toHaveCount(0)
  await page.clock.runFor(650)
  await expect(page.getByRole('button', { name: 'Start workout' })).toBeEnabled()

  const next = (await saved(page)).currentTicket
  const visible = (plan: typeof completed) => ({
    request: [plan.durationMinutes, plan.includeWarmup, plan.includeCooldown],
    reels: [plan.focus, plan.pattern, plan.finish],
    phases: plan.blocks.map((block: { kind: string; label: string; intervals: { durationSeconds: number; intensity: string; incline: number; cue: string }[] }) => ({
      kind: block.kind,
      label: block.label,
      intervals: block.intervals.map(interval => [interval.durationSeconds, interval.intensity, interval.incline, interval.cue]),
    })),
  })
  expect(visible(next)).not.toEqual(visible(completed))
})

test('Given result capabilities, image sharing stays direct and actions adapt to pointer type', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: (data: ShareData) => data.files?.every(file => file.type === 'image/png') })
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => {
      const activated = navigator.userActivation.isActive
      const file = data.files?.at(0)
      if (!file) throw new Error('Missing shared result')
      const image = await createImageBitmap(file)
      Object.assign(window, { sharedResult: { width: image.width, height: image.height, name: file.name, activated, keys: Object.keys(data) } })
      image.close()
    } })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { Object.assign(window, { copiedSummary: text }) } } })
  })
  await pullWorkout(page)
  await page.getByRole('button', { name: 'Start workout' }).click()
  await page.clock.runFor(5_500)
  await page.getByRole('button', { name: 'End workout', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, end' }).click()

  const preview = page.getByRole('img', { name: 'Shareable workout result preview' })
  await expect(preview).toHaveJSProperty('naturalWidth', 1080)
  await expect(preview).toHaveJSProperty('naturalHeight', 1350)
  await expect(page.locator('.result-share-actions button')).toHaveText(['Share image', 'Save PNG', 'Copy summary'])
  await page.getByRole('button', { name: 'Share image' }).click()
  await expect(page.getByRole('status')).toHaveText('Shared.')
  expect(await page.evaluate(() => (window as unknown as { sharedResult: unknown }).sharedResult)).toEqual({ width: 1080, height: 1350, name: 'cardio-slot-ended.png', activated: true, keys: ['files'] })
  await page.getByRole('button', { name: 'Copy summary' }).click()
  await expect(page.getByRole('status')).toHaveText('Summary copied.')
  expect(await page.evaluate(() => (window as unknown as { copiedSummary: string }).copiedSummary)).toContain('Cardio Slot — Session ended')
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Clipboard denied') } } }))
  await page.getByRole('button', { name: 'Copy summary' }).click()
  await expect(page.getByRole('status')).toHaveText('Summary could not be copied.')
  await expect(page.getByRole('button', { name: 'Pull another' })).toBeEnabled()

  await page.addInitScript(() => {
    const originalMatchMedia = window.matchMedia.bind(window)
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: (query: string) => query === '(pointer: coarse)'
      ? { matches: false, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => true }
      : originalMatchMedia(query) })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    Object.defineProperty(navigator, 'share', { configurable: true, value: async () => {} })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } })
  })
  await page.reload()
  await expect(page.locator('.result-share-actions button')).toHaveText(['Download PNG', 'Copy summary', 'Share image'])
})

test('Given sharing and clipboard are unsupported, the remaining image action stays usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false })
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
  })
  await pullWorkout(page)
  await page.getByRole('button', { name: 'Start workout' }).click()
  await page.clock.runFor(5_500)
  await page.getByRole('button', { name: 'End workout', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, end' }).click()

  await expect(page.locator('.result-share-actions button')).toHaveText(['Save PNG'])
  await expect(page.getByRole('button', { name: 'Save PNG' })).toHaveClass(/primary-button/)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Save PNG' }).click()
  expect((await download).suggestedFilename()).toBe('cardio-slot-ended.png')
})

test('Given rotation at every stage, the request and scheduled session remain unchanged', async ({ page }) => {
  await page.getByRole('button', { name: '15 min', exact: true }).click()
  await page.setViewportSize({ width: 844, height: 390 })
  await expect(page.getByRole('button', { name: '15 min', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Pull workout' }).click()
  const planId = (await saved(page)).currentTicket.id
  await page.clock.runFor(600)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.clock.runFor(2000)
  await page.setViewportSize({ width: 932, height: 430 })
  await page.clock.runFor(550)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.clock.runFor(600)
  await expect(page.getByRole('button', { name: 'Start workout' })).toBeEnabled()
  await page.setViewportSize({ width: 844, height: 320 })
  expect((await saved(page)).currentTicket.id).toBe(planId)
  await page.getByRole('button', { name: /Cool-down/ }).click()
  await page.getByLabel('Workout instructions').evaluate(element => { element.scrollTop = element.scrollHeight })
  await expect(page.getByText('Walk it down and breathe')).toBeVisible()
  await page.getByRole('button', { name: 'Start workout' }).click()
  const scheduled = (await saved(page)).activeRun.startTimestamp
  await page.clock.runFor(1500)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.getByText('GET READY')).toBeVisible()
  expect((await saved(page)).activeRun.startTimestamp).toBe(scheduled)
  await page.clock.runFor(4000)
  await page.setViewportSize({ width: 844, height: 390 })
  await expect(page.getByRole('button', { name: 'End workout', exact: true })).toBeVisible()
  await expect(page.getByText('UP NEXT')).toBeVisible()
  await page.clock.fastForward(180000)
  await page.reload()
  expect((await saved(page)).activeRun.startTimestamp).toBe(scheduled)
  await page.getByRole('button', { name: 'End workout', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('dialog', { name: 'Confirm end workout' })).toBeVisible()
  await page.clock.fastForward(900000)
  await expect(page.getByRole('heading', { name: 'COMPLETED' })).toBeVisible()
  const result = (await saved(page)).latestResult
  expect(result.plan.id).toBe(planId)
  expect(result.summary.elapsedSeconds).toBe(900)
  expect(result.summary.dateIso).toBe(new Date(scheduled + 900000).toISOString())
})

test('Given reduced motion and keyboard input, the lever produces a usable modal with focus return', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const lever = page.getByRole('button', { name: 'Pull workout' })
  await lever.focus()
  await page.keyboard.press('Enter')
  await page.clock.runFor(50)
  const dialog = page.getByRole('dialog', { name: 'Your workout ticket' })
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(lever).toBeFocused()
  await page.keyboard.press('Space')
  await page.clock.runFor(50)
  await expect(page.getByRole('button', { name: 'Start workout' })).toBeEnabled()
})

test('Given iPhone Safari, install guidance explains Add to Home Screen', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'iPhone-specific guidance')
  await page.getByRole('button', { name: 'Install app' }).click()
  await expect(page.getByRole('heading', { name: 'Add to Home Screen' })).toBeVisible()
})

test('Given a running session, timer ticks and motion suppression do not rewrite or restart it', async ({ page }) => {
  await page.evaluate(() => {
    const write = Storage.prototype.setItem
    let durableWrites = 0
    Object.defineProperty(window, 'durableWrites', { get: () => durableWrites })
    Storage.prototype.setItem = function (key, value) {
      if (key === 'cardio-slot-state-v2') durableWrites++
      return write.call(this, key, value)
    }
  })
  await pullWorkout(page)
  await page.getByRole('button', { name: 'Start workout' }).click()
  await page.clock.runFor(5500)
  const before = await saved(page)
  const writes = await page.evaluate(() => (window as unknown as { durableWrites: number }).durableWrites)
  await page.clock.runFor(2000)
  expect(await page.evaluate(() => (window as unknown as { durableWrites: number }).durableWrites)).toBe(writes)
  expect((await saved(page)).activeRun).toEqual(before.activeRun)
  await page.getByRole('button', { name: 'Motion on' }).click()
  await expect(page.getByRole('button', { name: 'Motion off' })).toHaveAttribute('aria-pressed', 'false')
  await page.clock.fastForward(10000)
  const after = await saved(page)
  expect(after.activeRun).toEqual(before.activeRun)
  expect(after.preferences.motion).toBe(false)
  await expect(page.locator('.run-progress')).toContainText('0:12')
})
