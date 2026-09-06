export type TabId = 'today' | 'calendar' | 'meds'

const TABS: { id: TabId; label: string }[] = [
  { id: 'today', label: '今日' },
  { id: 'calendar', label: '日历' },
  { id: 'meds', label: '药物' },
]

function Icon({ id, active }: { id: TabId; active: boolean }) {
  const stroke = active ? 'currentColor' : 'currentColor'
  if (id === 'today') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth={active ? 2.4 : 1.8} />
        <circle cx="12" cy="12" r="3" fill={active ? 'currentColor' : 'none'} stroke={stroke} strokeWidth="1.8" />
      </svg>
    )
  }
  if (id === 'calendar') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="3" stroke={stroke} strokeWidth={active ? 2.2 : 1.8} />
        <path d="M4 10h16" stroke={stroke} strokeWidth="1.8" />
        <path d="M8 3v4M16 3v4" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="4" width="10" height="16" rx="3" stroke={stroke} strokeWidth={active ? 2.2 : 1.8} />
      <path d="M12 9v6M9 12h6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function TabBar({
  tab,
  onChange,
}: {
  tab: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <nav className="safe-bottom absolute inset-x-0 bottom-0 z-10 border-t border-line bg-card/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-3 px-2 pt-2">
        {TABS.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex min-h-12 flex-col items-center justify-center rounded-2xl text-sm ${
                active ? 'text-teal-dark' : 'text-muted'
              }`}
            >
              <Icon id={item.id} active={active} />
              <span className="mt-1 font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
