import { expect, test, type Page } from '@playwright/test'

async function pullWorkout(page: Page) {
  await page.getByRole('button', { name: /pull workout|pull again/i }).click()
  await page.clock.fastForward(2_200)
  await expect(page.getByRole('heading', { name: 'YOUR WORKOUT' })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-17T06:00:00Z') })
  await page.goto('/')
})

test('Given a runner configures a workout, they can reroll, edit bookends, and end safely', async ({ page }) => {
  for (const theme of ['Track', 'Neon', 'Mono']) {
    await page.getByRole('button', { name: new RegExp(`^${theme}`) }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme.toLowerCase())
  }
  await page.getByRole('button', { name: '15 MIN' }).click()
  await pullWorkout(page)
  const firstSeed = await page.locator('.ticket-header').textContent()
  await pullWorkout(page)
  await expect(page.locator('.ticket-header')).not.toHaveText(firstSeed ?? '')

  await expect(page.locator('.ticket-duration')).toContainText('15:00')
  await page.getByLabel('Warm-up').uncheck()
  await expect(page.locator('.ticket-duration')).toContainText('13:00')
  await page.getByLabel('Cool-down').uncheck()
  await expect(page.locator('.ticket-duration')).toContainText('11:00')

  await page.getByRole('button', { name: 'Start workout' }).click()
  await expect(page.getByText('GET READY')).toBeVisible()
  await page.clock.fastForward(5_100)
  await expect(page.getByText(/BLOCK 1/)).toBeVisible()
  await page.clock.fastForward(65_000)
  await page.getByRole('button', { name: 'End workout' }).click()
  await expect(page.getByRole('dialog', { name: 'Confirm end workout' })).toBeVisible()
  await page.getByRole('button', { name: 'Yes, end' }).click()
  await expect(page.getByRole('heading', { name: 'SESSION ENDED' })).toBeVisible()
  await expect(page.getByText('Listening to your body always counts.')).toBeVisible()

  await page.evaluate(() => Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false }))
  await expect(page.getByRole('button', { name: 'Share result' })).toBeEnabled()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Share result' }).click()
  await expect(await download).toBeTruthy()
  await expect(page.getByRole('status')).toHaveText('PNG downloaded.')
})

test('Given a runner completes the ticket, the result celebrates the full workout', async ({ page }) => {
  await page.getByRole('button', { name: '15 MIN' }).click()
  await pullWorkout(page)
  await page.getByRole('button', { name: 'Start workout' }).click()
  await page.clock.fastForward(5_100)
  await page.clock.fastForward(15 * 60_000 + 500)
  await expect(page.getByRole('heading', { name: 'COMPLETED' })).toBeVisible()
  await expect(page.getByText('The whole ticket, start to finish.')).toBeVisible()
})

test('Given the app loaded once, its shell launches while offline', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit cannot navigate while its context is forced offline')
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await context.setOffline(true)
  await page.close()
  const offlinePage = await context.newPage()
  await offlinePage.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' })
  await expect(offlinePage.getByRole('button', { name: 'Cardio Slot home' })).toBeVisible()
  await context.setOffline(false)
})

test('Given iPhone Safari, install guidance explains Add to Home Screen', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'iPhone-specific guidance')
  await page.getByRole('button', { name: 'Install app' }).click()
  await expect(page.getByRole('heading', { name: 'Add to Home Screen' })).toBeVisible()
})
