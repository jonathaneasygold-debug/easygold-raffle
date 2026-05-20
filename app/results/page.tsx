'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadDrawResult, clearSession } from '@/lib/storage'
import { saveDrawToSheets, hasSheetConnection } from '@/lib/sheets'
import type { DrawResult, Winner } from '@/app/types'

export default function ResultsPage() {
  const router = useRouter()
  const [result,    setResult]    = useState<DrawResult | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const r = loadDrawResult()
    if (!r) { router.replace('/'); return }
    setResult(r)

    /* Confetti */
    ;(async () => {
      const confetti = (await import('canvas-confetti')).default
      confetti({ particleCount: 160, spread: 80, colors: ['#ffd685', '#edc065', '#ffdea2', '#ffffff'] })
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 100, origin: { x: 0.1 }, colors: ['#ffd685', '#edc065'] })
        confetti({ particleCount: 80, spread: 100, origin: { x: 0.9 }, colors: ['#ffd685', '#edc065'] })
      }, 600)
    })()
  }, [router])

  /* ── CSV Export ──────────────────────────────────────── */
  function exportCSV() {
    if (!result) return
    const header  = 'Tier,Prize,Name,Department,Ticket ID,Drawn At\n'
    const rows    = result.winners
      .map(w =>
        [w.tier.name, w.tier.prize, w.participant.name, w.participant.department, w.participant.ticketId, w.drawnAt]
          .map(v => `"${v}"`)
          .join(',')
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: `${result.drawName}-results.csv` })
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ── Save to Sheets ──────────────────────────────────── */
  async function saveToSheets() {
    if (!result) return
    setSaving(true)
    setSaveError('')
    try {
      await saveDrawToSheets(result)
      setSaved(true)
    } catch (e) {
      setSaveError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!result) return <div className="flex items-center justify-center min-h-screen text-on-surface-variant">Loading…</div>

  /* Group winners by tier */
  const byTier: Record<string, Winner[]> = {}
  for (const w of result.winners) {
    ;(byTier[w.tier.id] ??= []).push(w)
  }
  const grandTierId  = result.tiers[0]?.id
  const grandWinners = grandTierId ? (byTier[grandTierId] ?? []) : []

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="flex justify-between items-center px-10 py-5 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-sm sticky top-0 z-30">
        <h2
          className="text-[28px] font-extrabold text-primary"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          Easy Gold
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-high border border-outline-variant rounded-lg text-[13px] font-semibold hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>

          {hasSheetConnection() && !saved && (
            <button
              onClick={saveToSheets}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary/20 border border-primary/30 rounded-lg text-[13px] font-semibold text-primary hover:bg-primary/30 transition-colors disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">{saving ? 'hourglass_empty' : 'cloud_upload'}</span>
              {saving ? 'Saving…' : 'Save to Sheets'}
            </button>
          )}
          {saved && (
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Saved to Sheets
            </span>
          )}
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-10 pb-20">
        {/* Hero */}
        <section className="text-center py-14 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[12px] font-bold tracking-wider uppercase mb-5">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Official Draw Results
          </div>
          <h1
            className="text-[56px] font-extrabold text-primary mb-4"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            Draw Complete!
          </h1>
          <p className="text-[17px] text-on-surface-variant max-w-2xl mx-auto">
            Results for{' '}
            <span className="text-on-surface font-bold">{result.drawName}</span> have been
            cryptographically verified. Congratulations to all winners!
          </p>
          {saveError && (
            <p className="mt-4 text-error text-[13px]">{saveError}</p>
          )}
        </section>

        <div className="space-y-16">
          {/* Grand Prize */}
          {grandWinners.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-7">
                <span
                  className="material-symbols-outlined text-primary text-[32px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  stars
                </span>
                <h3
                  className="text-[28px] font-bold text-on-surface"
                  style={{ fontFamily: 'var(--font-sora)' }}
                >
                  Grand Prize {grandWinners.length === 1 ? 'Winner' : 'Winners'}
                </h3>
                {grandWinners.length > 1 && (
                  <span className="ml-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[12px] font-bold border border-primary/20">
                    {grandWinners.length}
                  </span>
                )}
              </div>

              {/* Hero card for first winner */}
              <div className="relative group mb-5">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 to-primary-container/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
                <div className="relative bg-surface-container-low border border-primary/30 rounded-2xl p-8 overflow-hidden">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
                    <div className="shimmer-btn absolute inset-0" />
                  </div>
                  <div className="grid md:grid-cols-[1fr_auto_220px] gap-8 items-center">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/40 shrink-0">
                        <span
                          className="material-symbols-outlined text-primary text-[38px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          workspace_premium
                        </span>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-primary tracking-[0.15em] uppercase mb-1">
                          {grandWinners[0].tier.prize}
                        </p>
                        <h4
                          className="text-[40px] font-extrabold text-on-surface"
                          style={{ fontFamily: 'var(--font-sora)' }}
                        >
                          {grandWinners[0].participant.name}
                        </h4>
                        <p className="text-[15px] text-on-surface-variant mt-0.5">
                          {grandWinners[0].participant.department}
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:block h-24 border-l-2 border-dashed border-outline-variant" />
                    <div className="text-right md:text-center">
                      <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                        Ticket ID
                      </p>
                      <span
                        className="text-[20px] font-extrabold text-primary bg-primary/10 px-4 py-2 rounded border border-primary/20 tracking-[0.1em]"
                        style={{ fontFamily: 'var(--font-sora)' }}
                      >
                        {grandWinners[0].participant.ticketId}
                      </span>
                      <p className="mt-3 text-[11px] text-on-surface-variant uppercase tracking-wider">
                        Drawn: {new Date(grandWinners[0].drawnAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional grand prize winners */}
              {grandWinners.length > 1 && (
                <div className="grid md:grid-cols-2 gap-5">
                  {grandWinners.slice(1).map(w => <WinnerCard key={w.participant.ticketId} winner={w} />)}
                </div>
              )}
            </section>
          )}

          {/* Secondary tiers */}
          {result.tiers.slice(1).map((tier, ti) => {
            const tierWinners = byTier[tier.id] ?? []
            if (!tierWinners.length) return null

            const isSmall = tierWinners.length <= 4

            return (
              <section key={tier.id}>
                <div className="flex items-center gap-3 mb-7">
                  <span className="material-symbols-outlined text-primary text-[28px]">military_tech</span>
                  <h3
                    className="text-[24px] font-bold text-on-surface"
                    style={{ fontFamily: 'var(--font-sora)' }}
                  >
                    {tier.name} Winners
                  </h3>
                  <span className="ml-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[12px] font-bold border border-primary/20">
                    {tierWinners.length}
                  </span>
                </div>

                {isSmall ? (
                  <div className="grid md:grid-cols-2 gap-5">
                    {tierWinners.map(w => <WinnerCard key={w.participant.ticketId} winner={w} />)}
                  </div>
                ) : (
                  <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-surface-container border-b border-outline-variant/30">
                        <tr>
                          {['Name', 'Department', 'Ticket ID', 'Prize'].map(h => (
                            <th key={h} className="px-7 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {tierWinners.map(w => (
                          <tr key={w.participant.ticketId} className="hover:bg-surface-container transition-colors">
                            <td className="px-7 py-4 text-[15px] text-on-surface">{w.participant.name}</td>
                            <td className="px-7 py-4 text-[15px] text-on-surface-variant">{w.participant.department}</td>
                            <td className="px-7 py-4">
                              <span
                                className="text-[13px] font-extrabold text-primary tracking-[0.1em]"
                                style={{ fontFamily: 'var(--font-sora)' }}
                              >
                                {w.participant.ticketId}
                              </span>
                            </td>
                            <td className="px-7 py-4 text-[15px] text-on-surface-variant">{w.tier.prize}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )
          })}
        </div>

        {/* Footer */}
        <footer className="mt-20 flex flex-col items-center gap-5 py-12 border-t border-outline-variant/20">
          <p className="text-[14px] text-on-surface-variant text-center max-w-lg">
            Verification code for this draw:{' '}
            <code className="bg-surface-container px-2.5 py-1 rounded text-primary font-mono">
              {result.id}
            </code>
          </p>
          <button
            onClick={() => { clearSession(); router.push('/') }}
            className="flex items-center gap-2 text-primary text-[13px] font-semibold hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Start a New Draw
          </button>
        </footer>
      </main>
    </div>
  )
}

function WinnerCard({ winner }: { winner: Winner }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-5 hover:border-primary/40 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[12px] font-bold text-primary-fixed-dim mb-1">{winner.tier.prize}</p>
          <h4
            className="text-[20px] font-semibold text-on-surface"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            {winner.participant.name}
          </h4>
          <p className="text-[14px] text-on-surface-variant mt-0.5">{winner.participant.department}</p>
        </div>
        <div className="text-right">
          <span
            className="text-[13px] font-extrabold text-primary block mb-2 tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            {winner.participant.ticketId}
          </span>
          <span className="bg-primary/5 text-primary text-[10px] px-2 py-0.5 rounded border border-primary/20 font-bold uppercase tracking-wider">
            Verified
          </span>
        </div>
      </div>
    </div>
  )
}
