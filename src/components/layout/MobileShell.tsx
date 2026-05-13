import type { ReactNode } from 'react'
import { ErrorBoundary } from '../common/ErrorBoundary'
import { BottomNav } from './BottomNav'
import { MiniPlayer } from '../player/MiniPlayer'

interface MobileShellProps {
  children: ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

export function MobileShell({ children, activeTab, onTabChange }: MobileShellProps) {
  return (
    <main className="nyxora-gradient min-h-screen text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden">
        <ErrorBoundary fallbackTitle="Page crashed safely">
          <div className="flex-1 overflow-y-auto pb-36">{children}</div>
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="Mini player crashed safely">
          <MiniPlayer />
        </ErrorBoundary>

        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      </section>
    </main>
  )
}
