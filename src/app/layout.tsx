import type { ReactNode } from 'react'

import { VercelAnalytics } from './vercel-analytics'

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <VercelAnalytics />
      </body>
    </html>
  )
}
