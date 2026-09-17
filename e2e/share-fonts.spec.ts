import { expect, test } from '@playwright/test'

test.use({ serviceWorkers: 'block' })

test('Given an unrelated page font stalls, the runner can still share the completed PNG', async ({ page }) => {
  let releaseFont: () => void = () => {}
  const pendingFont = new Promise<void>(resolve => { releaseFont = resolve })
  await page.route('**/unrelated-font.woff2', async route => { await pendingFont; await route.abort() })
  try {
    await page.clock.install()
    await page.goto('./')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'Pull workout' }).click()
    await page.clock.runFor(100)
    await page.getByRole('button', { name: 'Start workout' }).click()
    await page.clock.runFor(5500)
    await page.clock.resume()
    await page.evaluate(async () => {
      await Promise.all([document.fonts.load('700 45px "Barlow Condensed"'), document.fonts.load('800 118px "Barlow Condensed"'), document.fonts.load('600 48px "Barlow Condensed"'), document.fonts.load('500 25px "IBM Plex Mono"')])
      const font = new FontFace('Unrelated pending face', 'url(./unrelated-font.woff2)')
      document.fonts.add(font)
      const probe = document.createElement('span')
      probe.style.cssText = 'font-family: "Unrelated pending face"; position: fixed; left: -10000px'
      probe.textContent = 'An unrelated page font'
      document.body.append(probe)
      void font.load().catch(() => {})
    })
    await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loading')
    await page.getByRole('button', { name: 'End workout', exact: true }).click()
    await page.getByRole('button', { name: 'Yes, end' }).click()
    await expect(page.getByRole('button', { name: /^(Save|Download) PNG$/ })).toBeEnabled()
    await page.evaluate(() => Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false }))
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: /^(Save|Download) PNG$/ }).click()
    expect((await download).suggestedFilename()).toBe('cardio-slot-ended.png')
  } finally { releaseFont(); await page.unrouteAll({ behavior: 'wait' }) }
})

test('Given result fonts fail or stall, the runner can still download the completed PNG', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Pull workout' }).click()
  await page.clock.runFor(100)
  await page.getByRole('button', { name: 'Start workout' }).click()
  await page.clock.runFor(5500)
  await page.clock.resume()
  await page.evaluate(() => {
    let call = 0
    Object.defineProperty(document.fonts, 'load', { configurable: true, value: () => ++call === 1 ? Promise.reject(new Error('Font unavailable')) : new Promise(() => {}) })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false })
  })
  await page.getByRole('button', { name: 'End workout', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, end' }).click()
  await expect(page.getByRole('button', { name: /^(Save|Download) PNG$/ })).toBeEnabled()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /^(Save|Download) PNG$/ }).click()
  expect((await download).suggestedFilename()).toBe('cardio-slot-ended.png')
})
