import { useState } from 'react'
import { TabBar, type TabId } from './components/TabBar'
import { CalendarPage } from './pages/CalendarPage'
import { MedsPage } from './pages/MedsPage'
import { TodayPage } from './pages/TodayPage'

export default function App() {
  const [tab, setTab] = useState<TabId>('today')

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-paper text-ink">
      {tab === 'today' ? <TodayPage onGoMeds={() => setTab('meds')} /> : null}
      {tab === 'calendar' ? <CalendarPage /> : null}
      {tab === 'meds' ? <MedsPage /> : null}
      <TabBar tab={tab} onChange={setTab} />
    </div>
  )
}
