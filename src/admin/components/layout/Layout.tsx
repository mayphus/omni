import { Sidebar } from './Sidebar'
import { useHashRoute } from '../../lib/router'

export function Layout({ children }: { children: React.ReactNode }) {
  const { route } = useHashRoute()
  return (
    <div className="flex min-h-screen">
      <Sidebar current={route} />
      <main className="min-w-0 flex-1 p-4">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
