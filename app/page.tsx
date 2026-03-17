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

// フォームの初期値
const initialForm = {
  logged_at: new Date().toISOString().slice(0, 10),
  weight_kg: '',
  food_amount: '',
  poop_condition: '良好' as PoopStatus,
  memo: '',
}

export default function Home() {
  const [form, setForm] = useState(initialForm)
  const [logs, setLogs] = useState<CatLog[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

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

          {/* 日付 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              日付
            </label>
            <input
              type="date"
              required
              value={form.logged_at}
              onChange={(e) => setForm({ ...form, logged_at: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* 体重 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              体重 (kg)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="例: 4.20"
              value={form.weight_kg}
              onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* ごはんの量 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              ごはんの量
            </label>
            <input
              type="text"
              placeholder="例: ウェット1缶 + ドライ30g"
              value={form.food_amount}
              onChange={(e) => setForm({ ...form, food_amount: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* うんちの状態 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              うんちの状態
            </label>
            <select
              value={form.poop_condition}
              onChange={(e) =>
                setForm({ ...form, poop_condition: e.target.value as PoopStatus })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {POOP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              メモ
            </label>
            <textarea
              rows={3}
              placeholder="気になったことを記録..."
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

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
              <button
                onClick={() => handleDelete(log.id)}
                className="shrink-0 rounded-lg border border-red-200 px-3 py-1 text-xs text-red-400 hover:bg-red-50 transition-colors"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
