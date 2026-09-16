import { renderHook, waitFor } from '@testing-library/react'
import { useWakeLock } from './wakeLock'

class TestWakeLock extends EventTarget {
  async release() {
    this.dispatchEvent(new Event('release'))
  }
}

describe('Given a running workout returns from the background', () => {
  const originalWakeLock = Object.getOwnPropertyDescriptor(navigator, 'wakeLock')
  const originalVisibility = Object.getOwnPropertyDescriptor(document, 'visibilityState')

  afterEach(() => {
    if (originalWakeLock) Object.defineProperty(navigator, 'wakeLock', originalWakeLock)
    else Reflect.deleteProperty(navigator, 'wakeLock')
    if (originalVisibility) Object.defineProperty(document, 'visibilityState', originalVisibility)
  })

  it('requests a new screen wake lock after the browser releases the old one', async () => {
    const sentinels: TestWakeLock[] = []
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: async () => {
          const sentinel = new TestWakeLock()
          sentinels.push(sentinel)
          return sentinel
        },
      },
    })
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    const { result, unmount } = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(result.current).toBe('active'))

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    await sentinels[0]?.release()
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))

    await waitFor(() => expect(sentinels).toHaveLength(2))
    expect(result.current).toBe('active')
    unmount()
  })
})
