import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'BBALLAGENCY.com | Elite Basketball Agency',
  description: 'BBALLAGENCY.COM is a leading basketball agency representing elite players worldwide',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: { background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
          }}
        />
      </body>
    </html>
  )
}
