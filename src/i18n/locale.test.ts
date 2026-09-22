import { applyDocumentLocale, detectLocale, loadLocaleOverride, LOCALE_STORAGE_KEY, saveLocaleOverride } from './locale'

function memory(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
  }
}

describe('Given a first visit, browser language selects the supported locale', () => {
  it.each(['zh-TW', 'zh-Hant', 'zh-Hant-TW', 'zh-HK', 'zh-MO', 'zh-CN'])(
    'maps %s to Traditional Chinese',
    language => expect(detectLocale([language])).toBe('zh-TW'),
  )

  it('uses the first supported language and otherwise falls back to English', () => {
    expect(detectLocale(['fr-FR', 'zh-HK', 'en-US'])).toBe('zh-TW')
    expect(detectLocale(['zh-SG', 'ja-JP'])).toBe('en')
  })
})

describe('Given an explicit language choice, the override is safe and durable', () => {
  it('round-trips only supported locale values', () => {
    const storage = memory()
    expect(saveLocaleOverride('zh-TW', storage)).toBe(true)
    expect(storage.values.get(LOCALE_STORAGE_KEY)).toBe('zh-TW')
    expect(loadLocaleOverride(storage)).toBe('zh-TW')
    expect(loadLocaleOverride(memory({ [LOCALE_STORAGE_KEY]: 'zh-CN' }))).toBeNull()
  })

  it('keeps the current session usable when storage is unavailable', () => {
    expect(loadLocaleOverride({ getItem: () => { throw new DOMException('blocked') } })).toBeNull()
    expect(saveLocaleOverride('en', { setItem: () => { throw new DOMException('blocked') } })).toBe(false)
  })
})

describe('Given the locale changes, document language and install metadata stay synchronized', () => {
  it('updates the root language, title, description, and manifest link', () => {
    document.head.innerHTML = '<meta name="description" content=""><link id="app-manifest" rel="manifest" href="">'
    applyDocumentLocale('zh-TW', '/cardio-slot/')
    expect(document.documentElement.lang).toBe('zh-TW')
    expect(document.title).toBe('Cardio Slot｜跑步機間歇訓練')
    expect(document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content).toContain('跑步機')
    expect(document.querySelector<HTMLLinkElement>('#app-manifest')?.getAttribute('href')).toBe('/cardio-slot/manifest.zh-TW.webmanifest')
  })
})
