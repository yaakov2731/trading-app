import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s · GastroStock',
    default:  'GastroStock — Control de Inventario',
  },
  description: 'Sistema de gestión de inventario para negocios gastronómicos multi-local.',
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: '12px',
              border: '1px solid rgb(226 232 240)',
              boxShadow: '0 10px 24px -4px rgb(0 0 0 / 0.1)',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  )
}
