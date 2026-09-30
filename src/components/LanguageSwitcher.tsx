import { useEffect, useId, useRef, useState } from 'react'
import { useI18n, type Locale } from '../i18n'

const OPTIONS: { locale: Locale; label: string; name: 'language.en' | 'language.zh-TW' }[] = [
  { locale: 'en', label: 'English', name: 'language.en' },
  { locale: 'zh-TW', label: '繁體中文', name: 'language.zh-TW' },
]

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const pickerId = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return <div ref={root} className={`language-switcher ${className}`.trim()} role="group" aria-label={t('language.label')}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <button ref={trigger} className="language-trigger" type="button" aria-label={t('language.label')}
      aria-expanded={open} aria-controls={pickerId} onClick={() => setOpen(!open)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18M5 6.5h14M5 17.5h14" />
      </svg>
    </button>
    {open && <div className="language-options" id={pickerId}>
      {OPTIONS.map(option => <button className="language-choice" key={option.locale} type="button"
        aria-label={t(option.name)} aria-pressed={locale === option.locale} lang={option.locale}
        onClick={() => { setLocale(option.locale); setOpen(false); trigger.current?.focus() }}>
        {option.label}
        {locale === option.locale && <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4L19 6" /></svg>}
      </button>)}
    </div>}
  </div>
}
