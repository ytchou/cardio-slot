import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface DeviceIdentity {
  userAgent: string
  platform: string
  maxTouchPoints: number
}

export function isIosDevice(identity: DeviceIdentity = navigator) {
  return /iphone|ipad|ipod/i.test(identity.userAgent)
    || (identity.platform === 'MacIntel' && identity.maxTouchPoints > 1)
}

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && navigator.standalone === true)
}

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const install = async () => {
    if (promptEvent) {
      await promptEvent.prompt()
      await promptEvent.userChoice
      setPromptEvent(null)
      return
    }
    if (isIosDevice()) setShowIosHelp(true)
  }

  return {
    canInstall: !isStandalone() && (promptEvent !== null || isIosDevice()),
    showIosHelp,
    install,
    closeIosHelp: () => setShowIosHelp(false),
  }
}

declare global {
  interface Navigator {
    standalone?: boolean
  }
}
