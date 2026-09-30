import { expect, test } from '@playwright/test'

test.use({ serviceWorkers: 'block' })

test('Given an unrelated page font stalls, the runner can still save the completed PNG', async ({ page }) => {
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
      await Promise.all([document.fonts.load('400 38px "IBM Plex Mono"'), document.fonts.load('500 24px "IBM Plex Mono"'), document.fonts.load('600 76px "IBM Plex Mono"'), document.fonts.load('400 30px "Cardio Sans TC"'), document.fonts.load('500 30px "Cardio Sans TC"'), document.fonts.load('600 76px "Cardio Sans TC"')])
      const font = new FontFace('Unrelated pending face', 'url(./unrelated-font.woff2)')
      document.fonts.add(font)
      const probe = document.createElement('span')
      probe.style.cssText = 'font-family: "Unrelated pending face"; position: fixed; left: -10000px'
      probe.textContent = 'An unrelated page font'
      document.body.append(probe)
      void font.load().catch(() => {})
    })
    await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loading')
    await page.getByRole('button', { name: 'End session', exact: true }).click()
    await page.getByRole('button', { name: 'Yes, end' }).click()
    await expect(page.getByRole('button', { name: /^(Save|Download) PNG$/ })).toBeEnabled()
    await page.evaluate(() => Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false }))
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: /^(Save|Download) PNG$/ }).click()
    expect((await download).suggestedFilename()).toMatch(/^cardio-slot-(endurance|hills|speed)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-ended\.png$/)
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
  await page.getByRole('button', { name: 'End session', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, end' }).click()
  await expect(page.getByRole('button', { name: /^(Save|Download) PNG$/ })).toBeEnabled()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /^(Save|Download) PNG$/ }).click()
  expect((await download).suggestedFilename()).toMatch(/^cardio-slot-(endurance|hills|speed)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-ended\.png$/)
})

test('Given PNG rendering fails, the runner can still read the result and start another workout', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Pull workout' }).click()
  await page.clock.runFor(100)
  await page.getByRole('button', { name: 'Start workout' }).click()
  await page.clock.runFor(65_500)
  await page.clock.resume()
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = function (callback) { callback(null) }
  })
  await page.getByRole('button', { name: 'End session', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, end' }).click()
  const result = page.getByRole('region', { name: 'Workout result' })
  await expect(result.getByText('Image preparation is unavailable in this browser.')).toBeVisible()
  await expect(result.getByText('TIME', { exact: true })).toBeVisible()
  const elapsed = await page.evaluate(() => JSON.parse(localStorage.getItem('cardio-slot-state-v3') ?? 'null').latestResult.summary.elapsedSeconds)
  await expect(result.getByText(`${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, '0')}`, { exact: true }).first()).toBeVisible()
  await expect(result.getByText('TOP INCLINE', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Pull again' }).click()
  await expect(page.getByRole('button', { name: 'Pull workout' })).toBeVisible()
})

test('Given Chinese is selected, the bundled font loads and the runner can export a Chinese receipt', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Language', exact: true }).click()
  await page.getByRole('button', { name: 'Traditional Chinese' }).click()
  const loadedFaces = await page.evaluate(async () => (await document.fonts.load('600 24px "Cardio Sans TC"', '訓練摘要')).map(face => face.status))
  expect(loadedFaces).toEqual(['loaded'])
  await page.getByRole('button', { name: '拉出訓練' }).click()
  await page.clock.runFor(100)
  await page.getByRole('button', { name: '開始訓練' }).click()
  await page.clock.runFor(5500)
  await page.clock.resume()
  await page.getByRole('button', { name: '結束訓練' }).click()
  await page.getByRole('button', { name: '是，結束訓練' }).click()
  await expect(page.getByRole('img', { name: '可分享的訓練結果預覽' })).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '下載 PNG' }).click()
  expect((await download).suggestedFilename()).toMatch(/^cardio-slot-(endurance|hills|speed)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-ended\.png$/)
})
