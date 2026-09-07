import { useState } from 'react'
import { TabBar, type TabId } from './components/TabBar'
import { addDays, todayStr } from './lib/date'
import { CalendarPage } from './pages/CalendarPage'
import { MedsPage } from './pages/MedsPage'
import { TodayPage } from './pages/TodayPage'

export default function App() {
  const [tab, setTab] = useState<TabId>('today')
  const [calendarFocus, setCalendarFocus] = useState<string | null>(null)

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-paper text-ink">
      {tab === 'today' ? (
        <TodayPage
          onGoMeds={() => setTab('meds')}
          onGoYesterday={() => {
            setCalendarFocus(`${addDays(todayStr(), -1)}#${Date.now()}`)
            setTab('calendar')
          }}
        />
      ) : null}
      {tab === 'calendar' ? (
        <CalendarPage focusDate={calendarFocus?.split('#')[0] ?? null} />
      ) : null}
      {tab === 'meds' ? <MedsPage /> : null}
      <TabBar
        tab={tab}
        onChange={(id) => {
          if (id !== 'calendar') setCalendarFocus(null)
          setTab(id)
        }}
      />
    </div>
  )
}
