import { updateSymptoms } from '../lib/storage'
import {
  LEVEL_LABELS,
  OVERALL_LABELS,
  OVERALL_OPTIONS,
  SYMPTOM_KEYS,
  SYMPTOM_LABELS,
  type Overall,
  type SymptomKey,
  type SymptomLevel,
  type SymptomLog,
} from '../lib/types'

function SymptomRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: SymptomLevel
  onChange: (level: SymptomLevel) => void
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <span className="text-xs text-muted">{LEVEL_LABELS[value]}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {([0, 1, 2, 3] as SymptomLevel[]).map((level) => {
          const active = value === level
          const color =
            level === 0
              ? 'bg-mint/70'
              : level === 1
                ? 'bg-mint'
                : level === 2
                  ? 'bg-gold'
                  : 'bg-coral text-white'
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={`min-h-10 rounded-xl text-sm ${
                active ? `${color} font-semibold` : 'bg-paper text-muted'
              }`}
            >
              {LEVEL_LABELS[level]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SymptomEditor({
  date,
  log,
}: {
  date: string
  log?: SymptomLog
}) {
  return (
    <div>
      <div className="space-y-4">
        {SYMPTOM_KEYS.map((key) => (
          <SymptomRow
            key={key}
            label={SYMPTOM_LABELS[key]}
            value={(log?.[key] ?? 0) as SymptomLevel}
            onChange={(level) =>
              updateSymptoms(date, { [key]: level } as Record<SymptomKey, SymptomLevel>)
            }
          />
        ))}
      </div>
      <div className="mt-5">
        <p className="text-sm text-muted">整体</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {OVERALL_OPTIONS.map((opt) => {
            const active = log?.overall === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() =>
                  updateSymptoms(date, { overall: (active ? null : opt) as Overall | null })
                }
                className={`min-h-11 rounded-2xl text-sm font-medium ${
                  active ? 'bg-teal text-white' : 'bg-paper text-ink'
                }`}
              >
                {OVERALL_LABELS[opt]}
              </button>
            )
          })}
        </div>
      </div>
      <label className="mt-4 block">
        <span className="text-sm text-muted">备注</span>
        <textarea
          value={log?.note ?? ''}
          onChange={(e) => updateSymptoms(date, { note: e.target.value })}
          rows={2}
          placeholder="可选，比如夜里咳了几声"
          className="mt-2 w-full resize-none rounded-2xl border border-line bg-paper px-3 py-3 text-base outline-none"
        />
      </label>
    </div>
  )
}
