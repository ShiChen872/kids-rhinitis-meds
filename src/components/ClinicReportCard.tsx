import { CLINIC_DAYS, clinicReportText, type ClinicReport } from '../lib/clinic'
import { formatShortDate } from '../lib/date'
import { LEVEL_LABELS } from '../lib/types'

export function ClinicReportCard({
  report,
  onClose,
}: {
  report: ClinicReport
  onClose: () => void
}) {
  async function copyText() {
    const text = clinicReportText(report)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      window.prompt('复制下面这段发给医生', text)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-ink/40 p-4 pb-8">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-card p-4">
        <h2 className="text-lg font-semibold">近{CLINIC_DAYS}天 · 给医生看</h2>
        <p className="mt-1 text-sm text-muted">
          {report.childName} · {formatShortDate(report.start)}–{formatShortDate(report.end)}
        </p>
        <p className="mt-1 text-xs text-muted">截图或复制文字即可。不能替代医嘱。</p>

        <div className="mt-4 space-y-2">
          {report.meds.map((med) => (
            <div key={med.id} className="rounded-2xl bg-paper px-3 py-3">
              <p className="font-medium">{med.name}</p>
              <p className="mt-1 text-sm text-muted">
                这{CLINIC_DAYS}天用了 {med.taken} 次 · 按医嘱大约 {med.planned} 次
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto text-sm">
          <div className="min-w-[22rem] space-y-1">
            <div className="grid grid-cols-[3rem_2.5rem_3rem_2rem_1fr] gap-1 text-xs text-muted">
              <span>日期</span>
              <span>低温</span>
              <span>变天</span>
              <span>症状</span>
              <span>次数</span>
            </div>
            {report.days.map((day) => (
              <div
                key={day.date}
                className={`grid grid-cols-[3rem_2.5rem_3rem_2rem_1fr] items-center gap-1 rounded-xl px-1 py-1 ${
                  day.weatherNote || day.maxSymptom >= 2 ? 'bg-gold/25' : 'bg-paper'
                }`}
              >
                <span>{formatShortDate(day.date)}</span>
                <span>{day.tempMin == null ? '—' : `${day.tempMin}°`}</span>
                <span className="truncate">{day.weatherNote || '—'}</span>
                <span>{LEVEL_LABELS[day.maxSymptom as 0 | 1 | 2 | 3]}</span>
                <span className="truncate text-xs text-muted">
                  {report.meds.map((med) => `${day.doses[med.id] ?? 0}`).join(' / ')}
                </span>
              </div>
            ))}
          </div>
          {report.meds.length > 0 ? (
            <p className="mt-2 text-xs text-muted">
              次数顺序：{report.meds.map((med) => med.name).join(' / ')}
            </p>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-2xl border border-line bg-paper"
          >
            关闭
          </button>
          <button
            type="button"
            onClick={() => void copyText()}
            className="min-h-12 rounded-2xl bg-teal font-medium text-white"
          >
            复制文字
          </button>
        </div>
      </div>
    </div>
  )
}
