'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// うんちの状態の選択肢
const POOP_OPTIONS = ['良好', '普通', '軟便', '下痢', 'なし'] as const
type PoopStatus = (typeof POOP_OPTIONS)[number]

// cat_logs テーブルの行の型
type CatLog = {
  id: string
  logged_at: string
  weight_kg: number | null
  food_amount: string
  poop_condition: PoopStatus
  memo: string
  created_at: string
}

// フォームの値の型
type FormValues = {
  logged_at: string
  weight_kg: string
  food_amount: string
  poop_condition: PoopStatus
  memo: string
}

// フォームの初期値
const initialForm: FormValues = {
  logged_at: new Date().toISOString().slice(0, 10),
  weight_kg: '',
  food_amount: '',
  poop_condition: '良好',
  memo: '',
}

// 共通フォームフィールド
function LogFormFields({
  values,
  onChange,
}: {
  values: FormValues
  onChange: (v: FormValues) => void
}) {
  return (
    <>
      {/* 日付 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">日付</label>
        <input
          type="date"
          required
          value={values.logged_at}
          onChange={(e) => onChange({ ...values, logged_at: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* 体重 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">体重 (kg)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="例: 4.20"
          value={values.weight_kg}
          onChange={(e) => onChange({ ...values, weight_kg: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* ごはんの量 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">ごはんの量</label>
        <input
          type="text"
          placeholder="例: ウェット1缶 + ドライ30g"
          value={values.food_amount}
          onChange={(e) => onChange({ ...values, food_amount: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* うんちの状態 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">うんちの状態</label>
        <select
          value={values.poop_condition}
          onChange={(e) => onChange({ ...values, poop_condition: e.target.value as PoopStatus })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {POOP_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* メモ */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">メモ</label>
        <textarea
          rows={3}
          placeholder="気になったことを記録..."
          value={values.memo}
          onChange={(e) => onChange({ ...values, memo: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />
      </div>
    </>
  )
}

export default function Home() {
  const [form, setForm] = useState<FormValues>(initialForm)
  const [logs, setLogs] = useState<CatLog[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // 編集モーダル用
  const [editTarget, setEditTarget] = useState<CatLog | null>(null)
  const [editForm, setEditForm] = useState<FormValues>(initialForm)
  const [editLoading, setEditLoading] = useState(false)

  // 記録を新しい順で取得
  async function fetchLogs() {
    const { data, error } = await supabase
      .from('cat_logs')
      .select('*')
      .order('logged_at', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      setFetchError(error.message)
    } else {
      setLogs(data ?? [])
      setFetchError(null)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  // フォーム送信 → INSERT
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('cat_logs').insert({
      logged_at: form.logged_at,
      weight_kg: form.weight_kg !== '' ? parseFloat(form.weight_kg) : null,
      food_amount: form.food_amount,
      poop_condition: form.poop_condition,
      memo: form.memo,
    })

    setLoading(false)

    if (error) {
      alert('保存に失敗しました: ' + error.message)
      return
    }

    setForm(initialForm)
    await fetchLogs()
  }

  // 削除
  async function handleDelete(id: string) {
    const { error } = await supabase.from('cat_logs').delete().eq('id', id)
    if (error) {
      alert('削除に失敗しました: ' + error.message)
      return
    }
    await fetchLogs()
  }

  // 編集ボタン → モーダルを開く
  function openEdit(log: CatLog) {
    setEditTarget(log)
    setEditForm({
      logged_at: log.logged_at,
      weight_kg: log.weight_kg != null ? String(log.weight_kg) : '',
      food_amount: log.food_amount ?? '',
      poop_condition: log.poop_condition,
      memo: log.memo ?? '',
    })
  }

  // 編集保存 → UPDATE
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setEditLoading(true)

    const { error } = await supabase
      .from('cat_logs')
      .update({
        logged_at: editForm.logged_at,
        weight_kg: editForm.weight_kg !== '' ? parseFloat(editForm.weight_kg) : null,
        food_amount: editForm.food_amount,
        poop_condition: editForm.poop_condition,
        memo: editForm.memo,
      })
      .eq('id', editTarget.id)

    setEditLoading(false)

    if (error) {
      alert('更新に失敗しました: ' + error.message)
      return
    }

    setEditTarget(null)
    await fetchLogs()
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="mx-auto max-w-2xl px-4 py-10">

        {/* タイトル */}
        <h1 className="mb-8 text-center text-4xl font-bold text-amber-700 tracking-wide">
          🐱 にゃんログ
        </h1>

        {/* 入力フォーム */}
        <form
          onSubmit={handleSubmit}
          className="mb-10 rounded-2xl bg-white p-6 shadow-md space-y-4"
        >
          <h2 className="text-lg font-semibold text-amber-700">記録を追加</h2>
          <LogFormFields values={form} onChange={setForm} />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {loading ? '保存中...' : '記録する'}
          </button>
        </form>

        {/* 記録一覧 */}
        <h2 className="mb-4 text-lg font-semibold text-amber-700">記録一覧</h2>

        {fetchError && (
          <p className="mb-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600">
            取得エラー: {fetchError}
          </p>
        )}

        {logs.length === 0 && !fetchError && (
          <p className="text-center text-sm text-gray-400">まだ記録がありません</p>
        )}

        <ul className="space-y-3">
          {logs.map((log) => (
            <li
              key={log.id}
              className="rounded-2xl bg-white p-4 shadow-sm flex justify-between items-start gap-4"
            >
              <div className="flex-1 space-y-1 text-sm text-gray-700">
                <p className="font-semibold text-amber-700">{log.logged_at}</p>
                {log.weight_kg != null && (
                  <p>体重: <span className="font-medium">{log.weight_kg} kg</span></p>
                )}
                {log.food_amount && (
                  <p>ごはん: {log.food_amount}</p>
                )}
                <p>うんち: {log.poop_condition}</p>
                {log.memo && (
                  <p className="text-gray-500">{log.memo}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => openEdit(log)}
                  className="rounded-lg border border-amber-200 px-3 py-1 text-xs text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-400 hover:bg-red-50 transition-colors"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 編集モーダル */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setEditTarget(null) }}
        >
          <div className="w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-amber-700">記録を編集</h2>
              <button
                onClick={() => setEditTarget(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <LogFormFields values={editForm} onChange={setEditForm} />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {editLoading ? '保存中...' : '保存する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
