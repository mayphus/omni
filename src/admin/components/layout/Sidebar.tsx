import { type Route } from '../../lib/router'
import { Button } from '../ui/button'

interface SidebarProps {
  current: Route
  userName: string
  onSignOut: () => void
}

export function Sidebar({ current, userName, onSignOut }: SidebarProps) {
  const items: { key: Route; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'products', label: 'Products' },
    { key: 'orders', label: 'Orders' },
    { key: 'users', label: 'Users' },
    { key: 'system', label: 'System' },
  ]
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-background md:flex md:flex-col">
      <div className="p-3 text-sm font-semibold">Admin</div>
      <nav className="flex-1 px-2 text-sm">
        {items.map((item) => {
          const active = current === item.key
          return (
            <a
              key={item.key}
              href={`#/` + item.key}
              className={
                'block rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground ' +
                (active ? 'bg-accent text-accent-foreground' : 'text-foreground')
              }
            >
              {item.label}
            </a>
          )
        })}
      </nav>
      <div className="border-t p-3 text-xs text-muted-foreground">
        <div className="mb-2 truncate text-foreground" title={userName}>{userName}</div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </aside>
  )
}
