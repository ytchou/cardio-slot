import '@fontsource/barlow-condensed/latin-500.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/barlow-condensed/latin-800.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyDocumentLocale, I18nProvider, resolveInitialLocale } from './i18n'

const root = document.getElementById('root')
if (!root) throw new Error('App root was not found')
const locale = resolveInitialLocale()
applyDocumentLocale(locale)

createRoot(root).render(
  <StrictMode>
    <I18nProvider initialLocale={locale}><App /></I18nProvider>
  </StrictMode>,
)
