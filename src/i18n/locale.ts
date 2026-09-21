import { translate, type Locale } from './catalog'

export const LOCALE_STORAGE_KEY = 'cardio-slot-locale'
const ZH_TW_MATCHES = ['zh-tw', 'zh-hant', 'zh-hk', 'zh-mo', 'zh-cn']

export function detectLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const normalized = language.toLowerCase()
    if (ZH_TW_MATCHES.some(match => normalized === match || normalized.startsWith(`${match}-`))) return 'zh-TW'
    if (normalized === 'en' || normalized.startsWith('en-')) return 'en'
  }
  return 'en'
}

export function loadLocaleOverride(storage: Pick<Storage, 'getItem'> = localStorage): Locale | null {
  try {
    const locale = storage.getItem(LOCALE_STORAGE_KEY)
    return locale === 'en' || locale === 'zh-TW' ? locale : null
  } catch {
    return null
  }
}

export function saveLocaleOverride(locale: Locale, storage: Pick<Storage, 'setItem'> = localStorage) {
  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale)
    return true
  } catch {
    return false
  }
}

export function resolveInitialLocale(languages: readonly string[] = navigator.languages): Locale {
  return loadLocaleOverride() ?? detectLocale(languages)
}

export function applyDocumentLocale(locale: Locale, basePath = import.meta.env.BASE_URL) {
  document.documentElement.lang = locale
  document.title = translate(locale, 'document.title')
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', translate(locale, 'document.description'))
  const manifest = document.querySelector<HTMLLinkElement>('#app-manifest')
  if (manifest) manifest.setAttribute('href', `${basePath}manifest.${locale}.webmanifest`)
}
