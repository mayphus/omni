import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

type DialogContextValue = {
  open: boolean
  setOpen: (v: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

export function Dialog(
  props: { open?: boolean; defaultOpen?: boolean; onOpenChange?: (v: boolean) => void; children: React.ReactNode }
) {
  const { open: controlled, defaultOpen, onOpenChange, children } = props
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState<boolean>(!!defaultOpen)
  const isControlled = controlled !== undefined
  const open = isControlled ? !!controlled : uncontrolledOpen
  const setOpen = (v: boolean) => {
    if (!isControlled) setUncontrolledOpen(v)
    onOpenChange?.(v)
  }

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>
}

export function DialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactElement<any> }) {
  const ctx = React.useContext(DialogContext)
  if (!ctx) return children
  const onClick = () => ctx.setOpen(true)
  return asChild && React.isValidElement(children)
    ? (React.cloneElement(children as any, { onClick: chain((children as any).props.onClick, onClick) } as any))
    : (
        <button onClick={onClick} type="button">
          {children}
        </button>
      )
}

export function DialogClose({ asChild, children }: { asChild?: boolean; children: React.ReactElement<any> }) {
  const ctx = React.useContext(DialogContext)
  if (!ctx) return children
  const onClick = () => ctx.setOpen(false)
  return asChild && React.isValidElement(children)
    ? (React.cloneElement(children as any, { onClick: chain((children as any).props.onClick, onClick) } as any))
    : (
        <button onClick={onClick} type="button">
          {children}
        </button>
      )
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(DialogContext)
  if (!ctx || !ctx.open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => ctx.setOpen(false)} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg outline-none',
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5', className)} {...props} />
}
export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
}
export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex justify-end gap-2', className)} {...props} />
}

function chain<A extends any[]>(...fns: (((...a: A) => any) | undefined)[]) {
  return (...a: A) => {
    for (const fn of fns) fn?.(...a)
  }
}
