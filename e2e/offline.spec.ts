import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { expect, test } from '@playwright/test'

async function startOrigin() {
  let revision = 0
  const root = resolve('dist')
  const types: Record<string, string> = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' }
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
    const relative = pathname.replace(/^\/cardio-slot\//, '') || 'index.html'
    const file = resolve(root, relative)
    if (!file.startsWith(`${root}/`)) { response.writeHead(403).end(); return }
    try {
      const original = await readFile(file)
      const body = file.endsWith('/sw.js') ? Buffer.from(`${original.toString()}\n// Test deployment ${revision}`) : original
      response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(body)
    } catch { response.writeHead(404).end() }
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Missing test origin')
  return {
    url: `http://127.0.0.1:${address.port}/cardio-slot/`,
    deploy: () => { revision++ },
    close: async () => {
      if (!server.listening) return
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    },
  }
}

test('Given the origin goes away, a fresh page launches the cached app', async ({ context }) => {
  const origin = await startOrigin()
  try {
    const online = await context.newPage()
    await online.goto(origin.url)
    await online.evaluate(async () => { await navigator.serviceWorker.ready })
    await origin.close()
    const offline = await context.newPage()
    await offline.goto(origin.url, { waitUntil: 'domcontentloaded' })
    await expect(offline.getByRole('button', { name: 'Pull workout' })).toBeVisible()
    await offline.getByRole('button', { name: 'Pull workout' }).click()
    await expect(offline.getByRole('button', { name: 'Start workout' })).toBeEnabled()
  } finally { await origin.close() }
})

test('Given an update arrives during countdown, it waits through the run and restores the saved result', async ({ page }) => {
  const origin = await startOrigin()
  try {
    await page.goto(origin.url)
    await page.evaluate(async () => { await navigator.serviceWorker.ready })
    await page.reload()
    await page.clock.install({ time: new Date('2026-09-17T06:00:00Z') })
    await page.getByRole('button', { name: 'Pull workout' }).click()
    await page.clock.runFor(3650)
    await page.getByRole('button', { name: 'Start workout' }).click()
    const initialDocument = await page.evaluate(() => performance.timeOrigin)
    origin.deploy()
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.ready; await registration.update() })
    await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker.ready).waiting)).toBe(true)
    await expect(page.getByText('GET READY')).toBeVisible()
    await page.clock.runFor(5500)
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(initialDocument)
    expect(await page.evaluate(async () => !!(await navigator.serviceWorker.ready).waiting)).toBe(true)
    await page.getByRole('button', { name: 'End workout', exact: true }).click()
    const reloaded = page.waitForEvent('load')
    await page.getByRole('button', { name: 'Yes, end' }).click()
    await page.clock.runFor(500)
    await reloaded
    await expect(page.getByRole('heading', { name: 'SESSION ENDED' })).toBeVisible()
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('cardio-slot-state-v3') ?? 'null'))
    expect(saved.activeRun).toBeNull()
    expect(saved.latestResult.summary.status).toBe('ended')
  } finally { await origin.close() }
})

for (const [stage, elapsed] of [['spinning', 600], ['printing', 2600], ['opening', 3150]] as const) {
  test(`Given an update arrives while ${stage}, activation waits for the sequence then reloads cleanly`, async ({ page }) => {
    const origin = await startOrigin()
    try {
      await page.goto(origin.url)
      await page.evaluate(async () => { await navigator.serviceWorker.ready })
      await page.reload()
      await page.clock.install()
      await page.getByRole('button', { name: 'Pull workout' }).click()
      await page.clock.runFor(elapsed)
      const initialDocument = await page.evaluate(() => performance.timeOrigin)
      origin.deploy()
      await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update() })
      await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker.ready).waiting)).toBe(true)
      expect(await page.evaluate(() => performance.timeOrigin)).toBe(initialDocument)
      const reloaded = page.waitForEvent('load')
      await page.clock.runFor(4000)
      await reloaded
      await expect(page.getByRole('button', { name: 'View ticket' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Pull workout' })).toBeVisible()
    } finally { await origin.close() }
  })
}
