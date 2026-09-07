import { Card } from './Screen'
import { bottleStatus, bottleSummary } from '../lib/bottle'
import { formatTime } from '../lib/date'
import { logDose, undoLastDose, updateDoseTime } from '../lib/storage'
import { FORM_LABELS, type DoseLog, type Medication } from '../lib/types'

export function DoseTimeChip({ dose }: { dose: DoseLog }) {
  return (
    <label className="relative inline-flex min-h-10 min-w-[3.25rem] items-center justify-center rounded-xl bg-paper px-2 text-sm text-ink">
      {formatTime(dose.takenAt)}
      <input
        type="time"
        value={formatTime(dose.takenAt)}
        onChange={(e) => {
          if (e.target.value) updateDoseTime(dose.id, e.target.value)
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="改用药时间"
      />
    </label>
  )
}

export function DoseCheckIn({
  date,
  medications,
  doseLogs,
  canEdit,
  showBottle = false,
}: {
  date: string
  medications: Medication[]
  doseLogs: DoseLog[]
  canEdit: boolean
  showBottle?: boolean
}) {
  if (medications.length === 0) {
    return <p className="text-sm text-muted">还没有药物档案</p>
  }

  return (
    <div className="space-y-3">
      {medications.map((med) => {
        const logs = doseLogs
          .filter((d) => d.medicationId === med.id && d.date === date)
          .sort((a, b) => a.takenAt.localeCompare(b.takenAt))
        const used = logs.length
        const over = used > med.timesPerDay
        const bottle = showBottle ? bottleStatus(med, doseLogs) : null
        const body = (
            <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{med.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {FORM_LABELS[med.form]} · {med.doseLabel || '按医嘱'} · 每天 {med.timesPerDay} 次
                </p>
              </div>
              <p className={`text-sm font-medium ${over ? 'text-coral' : 'text-teal-dark'}`}>
                已用 {used}/{med.timesPerDay}
              </p>
            </div>
            {over ? <p className="mt-2 text-xs text-coral">已超医嘱，仍可记录</p> : null}
            {logs.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {logs.map((dose) =>
                  canEdit ? (
                    <DoseTimeChip key={dose.id} dose={dose} />
                  ) : (
                    <span key={dose.id} className="text-xs text-muted">
                      {formatTime(dose.takenAt)}
                    </span>
                  ),
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted">{canEdit ? '还没记' : '当天未打卡'}</p>
            )}
            {logs.length > 0 && canEdit ? (
              <p className="mt-1 text-xs text-muted">点钟点可改成实际用药时间</p>
            ) : null}
            {bottle ? (
              <p className={`mt-2 text-xs ${bottle.low ? 'text-coral' : 'text-muted'}`}>
                {bottleSummary(bottle)}
              </p>
            ) : null}
            {canEdit ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => logDose(med.id, date)}
                  className="min-h-12 rounded-2xl bg-teal text-base font-medium text-white active:bg-teal-dark"
                >
                  记一次
                </button>
                <button
                  type="button"
                  disabled={used === 0}
                  onClick={() => undoLastDose(med.id, date)}
                  className="min-h-12 rounded-2xl border border-line bg-paper text-base font-medium disabled:opacity-40"
                >
                  撤销
                </button>
              </div>
            ) : null}
            </>
        )
        return showBottle ? (
          <Card key={med.id}>{body}</Card>
        ) : (
          <div key={med.id} className="rounded-2xl bg-paper px-3 py-2">
            {body}
          </div>
        )
      })}
    </div>
  )
}
