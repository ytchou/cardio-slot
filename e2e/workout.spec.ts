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
  await expect(page.getByRole('dialog').locator('.ticket-duration')).toContainText('15:00')
  const first = await saved(page)
  const ids = first.currentTicket.blocks.flatMap((block: { intervals: { id: string }[] }) => block.intervals.map(interval => interval.id))
  expect(await page.locator('[data-interval-id]').evaluateAll(elements => elements.map(element => element.getAttribute('data-interval-id')))).toEqual(ids)
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
  await page.getByRole('button', { name: 'End workout', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, end' }).click()
  await expect(page.getByRole('heading', { name: 'SESSION ENDED' })).toBeVisible()
  const result = (await saved(page)).latestResult.summary
  expect(result.elapsedSeconds).toBeGreaterThanOrEqual(65)
  expect(result.elapsedSeconds).toBeLessThan(72)
  await page.clock.resume()
  await page.evaluate(() => Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false }))
  await expect(page.getByRole('button', { name: 'Share result' })).toBeEnabled()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Share result' }).click()
  expect((await download).suggestedFilename()).toBe('cardio-slot-ended.png')
  await expect(page.getByRole('status')).toHaveText('PNG downloaded.')
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: (data: ShareData) => data.files?.every(file => file.type === 'image/png') })
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => {
      const activated = navigator.userActivation.isActive
      const file = data.files?.at(0)
      if (!file) throw new Error('Missing shared result')
      const image = await createImageBitmap(file)
      Object.assign(window, { sharedResult: { width: image.width, height: image.height, name: file.name, activated } })
      image.close()
    } })
  })
  await page.getByRole('button', { name: 'Share result' }).click()
  await expect(page.getByRole('status')).toHaveText('Shared.')
  expect(await page.evaluate(() => (window as unknown as { sharedResult: unknown }).sharedResult)).toEqual({ width: 1080, height: 1350, name: 'cardio-slot-ended.png', activated: true })
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
