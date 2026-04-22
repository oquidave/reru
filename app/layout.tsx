import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'RERU — Reusable Resources',
  description: 'Household waste collection and recycling service for Nsasa Estate, Mukono District.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
