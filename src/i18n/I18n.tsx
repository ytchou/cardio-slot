import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { translate, type Locale, type MessageKey } from './catalog'
import { applyDocumentLocale, saveLocaleOverride } from './locale'

interface I18nValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey, params?: Record<string, string | number>) => string
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, updateLocale] = useState(initialLocale)
  useEffect(() => { applyDocumentLocale(locale) }, [locale])
  const setLocale = useCallback((next: Locale) => {
    saveLocaleOverride(next)
    updateLocale(next)
  }, [])
  const value = useMemo<I18nValue>(() => ({
    locale,
    setLocale,
    t: (key, params) => translate(locale, key, params),
    formatDate: (input, options) => new Intl.DateTimeFormat(locale, options).format(new Date(input)),
  }), [locale, setLocale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used within I18nProvider')
  return value
}
