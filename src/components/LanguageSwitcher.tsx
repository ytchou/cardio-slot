import { useI18n, type Locale } from '../i18n'

const OPTIONS: { locale: Locale; label: string; name: 'language.en' | 'language.zh-TW' }[] = [
  { locale: 'en', label: 'EN', name: 'language.en' },
  { locale: 'zh-TW', label: '中文', name: 'language.zh-TW' },
]

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n()
  return <div className={`language-switcher ${className}`.trim()} role="group" aria-label={t('language.label')}>
    {OPTIONS.map(option => <button key={option.locale} type="button" aria-label={t(option.name)} aria-pressed={locale === option.locale}
      onClick={() => setLocale(option.locale)}>{option.label}</button>)}
  </div>
}
