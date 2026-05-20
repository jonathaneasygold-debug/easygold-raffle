import type { Metadata } from 'next'
import { Sora, Hanken_Grotesk } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const sora = Sora({
  variable: '--font-sora-var',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

const hanken = Hanken_Grotesk({
  variable: '--font-hanken-var',
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Easy Gold — Premium Raffle Management',
  description: 'Internal corporate raffle management platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${hanken.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen overflow-x-hidden">
        {/* Ambient background glows */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-25">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full" />
        </div>
        <Sidebar />
        <div className="relative z-10 ml-[280px]">{children}</div>
      </body>
    </html>
  )
}
