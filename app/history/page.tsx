'use client'

import { useEffect, useState } from 'react'
import { fetchDrawHistory, hasSheetConnection } from '@/lib/sheets'
import type { HistoricalDraw, Winner } from '@/app/types'

export default function HistoryPage() {
  const [draws,     setDraws]     = useState<HistoricalDraw[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [expanded,  setExpanded]  = useState<Record<string, boolean>>({})
  const [page,      setPage]      = useState(1)
  const PER_PAGE = 5

  const hasSheets = hasSheetConnection()

  useEffect(() => {
    if (!hasSheets) { setLoading(false); return }
    fetchDrawHistory()
      .then(setDraws)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [hasSheets])

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const totalPages   = Math.max(1, Math.ceil(draws.length / PER_PAGE))
  const visibleDraws = draws.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="min-h-screen">
      <main className="px-10 py-12 max-w-[1200px] mx-auto">
        {/* Header */}
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2
              className="text-5xl font-extrabold text-primary uppercase tracking-tight mb-2"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              Draw History
            </h2>
            <p className="text-[16px] text-on-surface-variant">
              Review past distributions and view generated tickets.
            </p>
          </div>

          {/* Connection indicator */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-surface-container-high rounded-lg border border-outline-variant text-[13px] font-semibold">
            {hasSheets ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-on-surface">Google Sheets</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-on-surface-variant">localStorage</span>
              </>
            )}
          </div>
        </header>

        {/* States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant gap-4">
            <span className="material-symbols-outlined text-[48px] animate-spin text-primary">refresh</span>
            <p className="text-[15px]">Loading draw history…</p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-error-container/20 border border-error/30 rounded-xl text-error text-[14px]">
            Failed to load history: {error}
          </div>
        )}

        {!loading && !error && !hasSheets && (
          <EmptyState
            icon="cloud_off"
            title="Google Sheets not configured"
            description="Set the NEXT_PUBLIC_APPS_SCRIPT_URL environment variable to enable draw history storage and retrieval."
          />
        )}

        {!loading && !error && hasSheets && draws.length === 0 && (
          <EmptyState
            icon="history"
            title="No draws yet"
            description="Complete your first raffle draw to see it appear here."
          />
        )}

        {/* Draw list */}
        {visibleDraws.length > 0 && (
          <div className="space-y-5">
            {visibleDraws.map((draw, i) => (
              <DrawRow
                key={draw.id}
                draw={draw}
                isFirst={i === 0}
                isExpanded={Boolean(expanded[draw.id])}
                onToggle={() => toggleExpand(draw.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <footer className="mt-14 flex justify-center items-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-full border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-9 h-9 flex items-center justify-center rounded text-[13px] font-bold transition-colors ${
                    n === page
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-full border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </footer>
        )}
      </main>
    </div>
  )
}

/* ── Draw Row ─────────────────────────────────────────────── */
function DrawRow({
  draw,
  isFirst,
  isExpanded,
  onToggle,
}: {
  draw: HistoricalDraw
  isFirst: boolean
  isExpanded: boolean
  onToggle: () => void
}) {
  const byTier: Record<string, Winner[]> = {}
  for (const w of draw.winners ?? []) {
    ;(byTier[w.tier.id] ??= []).push(w)
  }

  return (
    <div
      className={`glass-card rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.005] hover:shadow-[0_0_30px_rgba(255,214,133,0.06)] border-l-4 ${
        isFirst ? 'border-l-primary' : 'border-l-outline-variant'
      }`}
    >
      {/* Row header */}
      <div className="p-7 flex items-center justify-between">
        <div className="flex items-center gap-7">
          <div
            className={`h-14 w-14 rounded-full flex items-center justify-center border ${
              isFirst ? 'bg-primary/20 border-primary/30' : 'bg-surface-container-highest border-outline-variant'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[28px] ${isFirst ? 'text-primary' : 'text-on-surface-variant'}`}
              style={isFirst ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {isFirst ? 'stars' : 'celebration'}
            </span>
          </div>

          <div>
            <h3
              className="text-[20px] font-semibold text-on-surface mb-1"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              {draw.drawName}
            </h3>
            <div className="flex gap-5 text-[14px] text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                {new Date(draw.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">group</span>
                {draw.totalWinners} Winners
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">confirmation_number</span>
                {draw.tiersCount} Tiers
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onToggle}
          className={`px-7 py-3 rounded-lg font-bold text-[13px] uppercase tracking-wider border transition-all duration-300 ${
            isExpanded
              ? 'bg-primary text-on-primary border-primary'
              : isFirst
              ? 'bg-surface-variant text-primary border-primary/20 hover:bg-primary hover:text-on-primary'
              : 'bg-surface-variant text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary'
          }`}
        >
          {isExpanded ? 'Hide Tickets' : 'View Tickets'}
        </button>
      </div>

      {/* Expandable tickets grid */}
      {isExpanded && (
        <div className="border-t border-outline-variant bg-surface-container-low p-7">
          {/* Tier badges */}
          <div className="mb-5 flex flex-wrap gap-3 items-center">
            <h4
              className="text-[17px] font-semibold text-primary-fixed-dim mr-2"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              Winning Tickets
            </h4>
            {(draw.tiers ?? []).map(t => (
              <span key={t.id} className="px-3 py-1 bg-surface-container rounded border border-outline-variant text-[12px] font-semibold text-on-surface-variant">
                {t.name}: {(byTier[t.id] ?? []).length}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {(draw.winners ?? []).map((w, i) => (
              <TicketCard key={`${w.participant.ticketId}-${i}`} winner={w} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Ticket Card ─────────────────────────────────────────── */
function TicketCard({ winner }: { winner: Winner }) {
  const isGrand = winner.tier.name?.toLowerCase().includes('grand')
  return (
    <div
      className={`relative bg-surface p-5 rounded-lg overflow-hidden group/ticket border-2 ${
        isGrand ? 'border-primary/30' : 'border-outline-variant'
      }`}
      style={{ maskImage: 'radial-gradient(circle at 0% 50%,transparent 10px,white 11px),radial-gradient(circle at 100% 50%,transparent 10px,white 11px)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover/ticket:opacity-100 transition-opacity" />

      <div className="flex justify-between items-start mb-3">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
            isGrand
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-secondary-container/50 text-on-secondary-container border-outline'
          }`}
        >
          {winner.tier.name}
        </span>
        <span
          className={`text-[18px] font-extrabold tracking-[0.1em] ${isGrand ? 'text-primary' : 'text-on-surface-variant opacity-50'}`}
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          {winner.participant.ticketId}
        </span>
      </div>

      <h5
        className="text-[17px] font-semibold text-on-surface truncate mb-0.5"
        style={{ fontFamily: 'var(--font-sora)' }}
      >
        {winner.participant.name}
      </h5>
      <p className="text-[13px] text-on-surface-variant opacity-60">{winner.participant.department}</p>

      <div className="mt-3 pt-3 border-t border-dashed border-outline-variant flex justify-between items-center">
        <span className={`text-[11px] uppercase font-bold ${isGrand ? 'text-primary/60' : 'text-on-surface-variant opacity-40'}`}>
          {winner.tier.prize}
        </span>
        <span
          className={`material-symbols-outlined text-[18px] ${isGrand ? 'text-primary' : 'text-on-surface-variant opacity-40'}`}
          style={isGrand ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          workspace_premium
        </span>
      </div>
    </div>
  )
}

/* ── Empty State ─────────────────────────────────────────── */
function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <span className="material-symbols-outlined text-[56px] text-on-surface-variant opacity-20">{icon}</span>
      <h3 className="text-[20px] font-semibold text-on-surface-variant" style={{ fontFamily: 'var(--font-sora)' }}>
        {title}
      </h3>
      <p className="text-[15px] text-on-surface-variant opacity-60 max-w-md">{description}</p>
    </div>
  )
}
