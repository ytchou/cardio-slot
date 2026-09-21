import { expect, test, type Page } from '@playwright/test'

async function saved(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('cardio-slot-state-v3') ?? 'null'))
}

test('Given a supported Chinese browser locale, the first visit uses Traditional Chinese', async ({ context, page }) => {
  await context.addInitScript(() => Object.defineProperty(navigator, 'languages', { configurable: true, get: () => ['zh-CN'] }))
  await page.goto('./')

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW')
  await expect(page).toHaveTitle('Cardio Slot｜跑步機間歇訓練')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /跑步機/)
  await expect(page.locator('#app-manifest')).toHaveAttribute('href', /manifest\.zh-TW\.webmanifest$/)
  await expect(page.getByRole('button', { name: '拉出訓練' })).toBeVisible()
})

test('Given a manual language choice, every stage updates without changing the workout', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-17T06:00:00Z') })
  await page.goto('./')
  await page.getByRole('button', { name: 'Traditional Chinese' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW')

  await page.getByRole('button', { name: '拉出訓練' }).click()
  const planId = (await saved(page)).currentTicket.id
  await page.clock.runFor(900)
  await page.getByRole('button', { name: '英文' }).click()
  await page.getByRole('button', { name: 'Traditional Chinese' }).click()
  expect((await saved(page)).currentTicket.id).toBe(planId)
  await page.clock.runFor(2_750)

  const ticket = page.getByRole('dialog', { name: '你的訓練單' })
  await expect(ticket).toBeVisible()
  await expect(ticket.getByRole('heading', { name: '今日訓練' })).toBeVisible()
  await expect(ticket.getByRole('button', { name: '開始訓練' })).toBeEnabled()
  await ticket.getByRole('button', { name: '開始訓練' }).click()
  const scheduled = (await saved(page)).activeRun.startTimestamp
  await page.clock.runFor(5_200)

  await expect(page.getByRole('button', { name: '英文' })).toBeVisible()
  await page.getByRole('button', { name: '英文' }).click()
  await expect(page.getByRole('button', { name: 'End session' })).toBeVisible()
  await page.getByRole('button', { name: 'Traditional Chinese' }).click()
  expect((await saved(page)).activeRun.startTimestamp).toBe(scheduled)

  await page.evaluate(() => {
    const fillText = CanvasRenderingContext2D.prototype.fillText
    Object.assign(window, { localizedImageText: [] as string[] })
    CanvasRenderingContext2D.prototype.fillText = function (text: string, x: number, y: number, maxWidth?: number) {
      ;(window as unknown as { localizedImageText: string[] }).localizedImageText.push(text)
      if (maxWidth === undefined) fillText.call(this, text, x, y)
      else fillText.call(this, text, x, y, maxWidth)
    }
  })
  await page.getByRole('button', { name: '結束訓練' }).click()
  await page.getByRole('button', { name: '是，結束訓練' }).click()
  await expect(page.getByRole('region', { name: '訓練結果' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => (window as unknown as { localizedImageText: string[] }).localizedImageText)).toContain('訓練摘要')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW')
  await expect(page.getByRole('region', { name: '訓練結果' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('cardio-slot-locale'))).toBe('zh-TW')
})
