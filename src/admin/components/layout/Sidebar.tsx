import { type Route } from '../../lib/router'

export function Sidebar({ current }: { current: Route }) {
  const items: { key: Route; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'products', label: 'Products' },
    { key: 'orders', label: 'Orders' },
    { key: 'users', label: 'Users' },
    { key: 'system', label: 'System' },
  ]
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-background md:block">
      <div className="p-3 text-sm font-semibold">Admin</div>
      <nav className="px-2 text-sm">
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
    </aside>
  )
}
