import type { ReactNode } from 'react'

export function Screen({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="safe-top px-5 pb-3">
        <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28">{children}</div>
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-3xl bg-card p-4 shadow-[0_8px_24px_rgba(31,42,36,0.05)] ${className}`}>
      {children}
    </section>
  )
}
