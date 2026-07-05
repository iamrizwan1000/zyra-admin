'use client'

import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider i18n={enTranslations}>
      {children}
    </AppProvider>
  )
}
