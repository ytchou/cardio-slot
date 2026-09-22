import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { I18nProvider, type Locale } from '../i18n'

export function renderWithI18n(ui: ReactElement, locale: Locale = 'en', options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options, wrapper: ({ children }: { children: ReactNode }) => <I18nProvider initialLocale={locale}>{children}</I18nProvider> })
}
