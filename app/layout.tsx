import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LexPlain — Legal Document Simplifier',
  description: 'Upload legal documents and get plain-English summaries, risk flags, and answers to your questions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
