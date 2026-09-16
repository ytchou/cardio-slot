import { useEffect, useState } from 'react'

export type WakeLockStatus = 'inactive' | 'active' | 'unsupported' | 'denied'

export function useWakeLock(enabled: boolean) {
  const [status, setStatus] = useState<WakeLockStatus>('inactive')

  useEffect(() => {
    if (!enabled) {
      setStatus('inactive')
      return
    }
    if (!('wakeLock' in navigator)) {
      setStatus('unsupported')
      return
    }

    let sentinel: WakeLockSentinel | null = null
    let disposed = false
    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen')
        if (disposed) {
          await sentinel.release()
          return
        }
        setStatus('active')
        sentinel.addEventListener('release', () => {
          if (!disposed && document.visibilityState === 'visible') setStatus('inactive')
        })
      } catch {
        if (!disposed) setStatus('denied')
      }
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !sentinel) void request()
    }
    void request()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (sentinel) void sentinel.release()
      sentinel = null
    }
  }, [enabled])

  return status
}

