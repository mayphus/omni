import { Sidebar } from './Sidebar'
import { useHashRoute } from '../../lib/router'
import { Button } from '../ui/button'
import { getUserDisplayName, type CloudbaseUser } from '../../lib/cloudbase'

interface LayoutProps {
  children: React.ReactNode
  user: CloudbaseUser
  onSignOut: () => void
}

export function Layout({ children, user, onSignOut }: LayoutProps) {
  const { route } = useHashRoute()
  const displayName = getUserDisplayName(user)
  return (
    <div className="flex min-h-screen">
      <Sidebar current={route} userName={displayName} onSignOut={onSignOut} />
      <main className="min-w-0 flex-1 p-4">
        <div className="mb-4 flex items-start justify-between gap-3 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground md:hidden">
          <div>
            Signed in as <span className="font-medium text-foreground">{displayName}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
