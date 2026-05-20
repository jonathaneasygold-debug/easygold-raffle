import type { DrawResult, HistoricalDraw } from '@/app/types'

const URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL

export function hasSheetConnection(): boolean {
  return Boolean(URL)
}

export async function saveDrawToSheets(result: DrawResult): Promise<void> {
  if (!URL) throw new Error('NEXT_PUBLIC_APPS_SCRIPT_URL is not configured')

  await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
    mode: 'no-cors', // Apps Script requires CORS-less POST
  })
  // no-cors means we can't inspect the response; assume success on no network error
}

export async function fetchDrawHistory(): Promise<HistoricalDraw[]> {
  if (!URL) return []

  const res = await fetch(`${URL}?action=history`)
  if (!res.ok) throw new Error(`History fetch failed: ${res.status}`)
  const data = await res.json()
  return (data.draws ?? []) as HistoricalDraw[]
}
