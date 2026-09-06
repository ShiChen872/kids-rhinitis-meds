import { useEffect, useRef, useState } from 'react'
import { Card, Screen } from '../components/Screen'
import { todayStr } from '../lib/date'
import {
  addMedication,
  getState,
  parseBackup,
  removeMedication,
  replaceState,
  updateMedication,
  updateSettings,
  useAppState,
} from '../lib/storage'
import {
  FORM_LABELS,
  MED_FORMS,
  type MedForm,
  type Medication,
} from '../lib/types'
import { geocodeCity } from '../lib/weather'

const emptyForm = {
  name: '',
  form: 'spray' as MedForm,
  timesPerDay: 2,
  doseLabel: '',
  active: true,
}

export function MedsPage() {
  const { medications, settings } = useAppState()
  const [editing, setEditing] = useState<Medication | 'new' | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [cityDraft, setCityDraft] = useState(settings.city)
  const [childDraft, setChildDraft] = useState(settings.childName)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(() => setMessage(''), 2400)
    return () => window.clearTimeout(t)
  }, [message])

  function openNew() {
    setForm(emptyForm)
    setEditing('new')
  }

  function openEdit(med: Medication) {
    setForm({
      name: med.name,
      form: med.form,
      timesPerDay: med.timesPerDay,
      doseLabel: med.doseLabel,
      active: med.active,
    })
    setEditing(med)
  }

  function saveMed() {
    const name = form.name.trim()
    if (!name) {
      setMessage('请填写药名')
      return
    }
    const timesPerDay = Math.min(12, Math.max(1, Number(form.timesPerDay) || 1))
    const payload = {
      name,
      form: form.form,
      timesPerDay,
      doseLabel: form.doseLabel.trim(),
      active: form.active,
    }
    if (editing === 'new') addMedication(payload)
    else if (editing) updateMedication(editing.id, payload)
    setEditing(null)
    setMessage('')
  }

  async function saveCity() {
    const name = cityDraft.trim()
    if (!name) return
    try {
      const geo = await geocodeCity(name)
      if (!geo) {
        setMessage('没找到这个城市，请换个写法试试')
        return
      }
      updateSettings({
        city: geo.name,
        latitude: geo.latitude,
        longitude: geo.longitude,
      })
      setCityDraft(geo.name)
      setMessage(`城市已设为${geo.name}`)
    } catch {
      setMessage('城市查找失败，请稍后再试')
    }
  }

  function saveChild() {
    const name = childDraft.trim() || '宝宝'
    updateSettings({ childName: name })
    setChildDraft(name)
    setMessage('已保存称呼')
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `鼻炎用药备份-${todayStr()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('已导出备份文件')
  }

  async function onImportFile(file: File) {
    try {
      const text = await file.text()
      const next = parseBackup(text)
      if (!window.confirm('导入会覆盖这台手机上的现有记录，确定吗？')) return
      replaceState(next)
      setCityDraft(next.settings.city)
      setChildDraft(next.settings.childName)
      setMessage('备份已导入')
    } catch {
      setMessage('备份文件读不出来')
    }
  }

  return (
    <Screen title="药物" subtitle="按医嘱设置次数，今日页会用来打卡">
      <div className="space-y-3">
        {medications.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">还没有药物。先加一种，比如鼻喷或口服抗过敏药。</p>
          </Card>
        ) : (
          medications.map((med) => (
            <Card key={med.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{med.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {FORM_LABELS[med.form]} · 每天 {med.timesPerDay} 次
                    {med.doseLabel ? ` · ${med.doseLabel}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-muted">{med.active ? '启用中' : '已暂停'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(med)}
                  className="min-h-10 rounded-xl bg-paper px-3 text-sm"
                >
                  编辑
                </button>
              </div>
            </Card>
          ))
        )}
        <button
          type="button"
          onClick={openNew}
          className="min-h-12 w-full rounded-2xl bg-teal text-base font-medium text-white"
        >
          添加药物
        </button>
      </div>

      <Card className="mt-6">
        <h2 className="font-semibold">设置</h2>
        <label className="mt-4 block text-sm text-muted">
          孩子称呼
          <input
            value={childDraft}
            onChange={(e) => setChildDraft(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-paper px-3 text-base text-ink outline-none"
          />
        </label>
        <button
          type="button"
          onClick={saveChild}
          className="mt-2 min-h-11 w-full rounded-2xl bg-paper text-sm font-medium"
        >
          保存称呼
        </button>

        <label className="mt-4 block text-sm text-muted">
          城市（用来看天气）
          <input
            value={cityDraft}
            onChange={(e) => setCityDraft(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-paper px-3 text-base text-ink outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => void saveCity()}
          className="mt-2 min-h-11 w-full rounded-2xl bg-paper text-sm font-medium"
        >
          保存城市
        </button>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold">备份</h2>
        <p className="mt-2 text-sm text-muted">
          记录只在这台手机里。换机或清理 Safari 前请先导出。
        </p>
        <button
          type="button"
          onClick={exportBackup}
          className="mt-3 min-h-12 w-full rounded-2xl bg-teal text-base font-medium text-white"
        >
          导出备份
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-paper text-base font-medium"
        >
          导入备份
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void onImportFile(file)
          }}
        />
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold">添加到主屏幕</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>用 Safari 打开本页（不要停在微信里）</li>
          <li>点底部分享按钮</li>
          <li>选择「添加到主屏幕」</li>
        </ol>
      </Card>

      <p className="mt-6 px-1 pb-4 text-center text-xs leading-5 text-muted">
        本应用仅作个人用药与症状记录，不能替代医嘱。
      </p>

      {message ? (
        <p className="fixed bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white">
          {message}
        </p>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-30 flex items-end bg-ink/40 p-4 pb-8">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-card p-4">
            <h2 className="text-lg font-semibold">{editing === 'new' ? '添加药物' : '编辑药物'}</h2>
            <label className="mt-4 block text-sm text-muted">
              药名
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例如 布地奈德鼻喷雾"
                className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-paper px-3 text-base text-ink outline-none"
              />
            </label>
            <p className="mt-4 text-sm text-muted">剂型</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {MED_FORMS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setForm({ ...form, form: f })}
                  className={`min-h-11 rounded-2xl text-sm ${
                    form.form === f ? 'bg-teal text-white' : 'bg-paper'
                  }`}
                >
                  {FORM_LABELS[f]}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-sm text-muted">
              每天几次（医嘱）
              <input
                type="number"
                min={1}
                max={12}
                value={form.timesPerDay}
                onChange={(e) => setForm({ ...form, timesPerDay: Number(e.target.value) })}
                className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-paper px-3 text-base text-ink outline-none"
              />
            </label>
            <label className="mt-4 block text-sm text-muted">
              每次剂量说明
              <input
                value={form.doseLabel}
                onChange={(e) => setForm({ ...form, doseLabel: e.target.value })}
                placeholder="例如 每侧各 1 喷"
                className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-paper px-3 text-base text-ink outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => setForm({ ...form, active: !form.active })}
              className="mt-4 min-h-12 w-full rounded-2xl bg-paper text-base"
            >
              {form.active ? '启用中（点此暂停）' : '已暂停（点此启用）'}
            </button>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="min-h-12 rounded-2xl border border-line bg-paper"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveMed}
                className="min-h-12 rounded-2xl bg-teal font-medium text-white"
              >
                保存
              </button>
            </div>
            {editing !== 'new' ? (
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm('删除后今日页不再显示，历史打卡仍会留在日历里。')) return
                  removeMedication(editing.id)
                  setEditing(null)
                }}
                className="mt-3 min-h-12 w-full text-sm text-coral"
              >
                删除这种药
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </Screen>
  )
}
