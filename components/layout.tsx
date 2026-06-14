'use client'

import { Sidebar } from './sidebar'
import { AIAssistant } from './ai-assistant'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto md:ml-64 pt-16 md:pt-0">
        <div className="p-6 md:p-8">{children}</div>
      </main>
      <AIAssistant />
    </div>
  )
}
