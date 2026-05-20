'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadDrawResult, clearSession } from '@/lib/storage'
import { saveDrawToSheets, hasSheetConnection } from '@/lib/sheets'
import type { DrawResult, Winner } from '@/app/types'

export default function ResultsPage() {
  const router = useRouter()
  const [result,      setResult]      = useState<DrawResult | null>(null)
  const [showModal,   setShowModal]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [saveError,   setSaveError]   = useState('')
  const [pendingNav,  setPendingNav]  = useState<string>('/')
  const origPushState = useRef<typeof window.history.pushState | null>(null)

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

  /* ── Navigation guard ────────────────────────────────── */
  useEffect(() => {
    if (saved || !hasSheetConnection()) return

    origPushState.current = window.history.pushState.bind(window.history)

    window.history.pushState = function(data: unknown, unused: string, url?: string | URL | null) {
      const target = (url ?? '').toString()
      if (!target.includes('/results')) {
        setPendingNav(target || '/')
        setShowModal(true)
        return
      }
      origPushState.current!(data, unused, url)
    }

    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      if (origPushState.current) window.history.pushState = origPushState.current
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [saved])

  function releaseGuard() {
    if (origPushState.current) {
      window.history.pushState = origPushState.current
      origPushState.current = null
    }
  }

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
      setShowModal(false)
      releaseGuard()
      clearSession()
      router.push(pendingNav)
    } catch (e) {
      setSaveError((e as Error).message)
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

              <div className="grid md:grid-cols-2 gap-5">
                {grandWinners.map(w => <WinnerCard key={w.participant.ticketId} winner={w} />)}
              </div>
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
                          {['Name', 'Ticket ID', 'Prize'].map(h => (
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
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-primary text-[13px] font-semibold hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Start a New Draw
          </button>
        </footer>
      </main>

      {/* Save / Discard modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-surface-container-low border border-outline-variant rounded-2xl p-10 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  cloud_upload
                </span>
              </div>
              <div>
                <h3 className="text-[22px] font-bold text-on-surface mb-2" style={{ fontFamily: 'var(--font-sora)' }}>
                  Save Draw Results?
                </h3>
                <p className="text-[14px] text-on-surface-variant">
                  Save this draw to Google Sheets for permanent record-keeping, or discard it to keep results session-only.
                </p>
              </div>
              {saveError && (
                <p className="text-error text-[13px] w-full text-left">{saveError}</p>
              )}
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => { releaseGuard(); clearSession(); router.push(pendingNav) }}
                  className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface-variant text-[13px] font-bold uppercase tracking-wider hover:border-error/50 hover:text-error transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={saveToSheets}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-[13px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save to Sheets'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
