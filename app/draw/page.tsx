'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadDrawConfig, saveDrawResult } from '@/lib/storage'
import { selectWinners } from '@/lib/raffle'
import type { DrawConfig } from '@/app/types'

interface FeedItem { id: string; name: string }

const ANIMATION_MS = 7000   // total animation time before navigating to results
const TICK_MS      = 180    // how fast tickets cycle

export default function DrawPage() {
  const router     = useRouter()
  const configRef  = useRef<DrawConfig | null>(null)

  const [currentTier, setCurrentTier]   = useState('')
  const [ticketId,    setTicketId]      = useState('T-0000')
  const [feedItems,   setFeedItems]     = useState<FeedItem[]>([])
  const [winnerFound, setWinnerFound]   = useState(false)
  const [winnerName,  setWinnerName]    = useState('')
  const [progress,    setProgress]      = useState(0)
  const [cancelled,   setCancelled]     = useState(false)

  useEffect(() => {
    const config = loadDrawConfig()
    if (!config) { router.replace('/'); return }
    configRef.current = config
    setCurrentTier(`${config.tiers[0]?.name ?? 'Draw'} — ${config.tiers[0]?.prize ?? ''}`)

    /* Run the actual cryptographic selection right away */
    let result
    try {
      result = selectWinners(config)
    } catch (e) {
      alert((e as Error).message)
      router.replace('/')
      return
    }
    saveDrawResult(result)

    /* Progress bar */
    const startTime = Date.now()
    const progressInterval = setInterval(() => {
      setProgress(Math.min(((Date.now() - startTime) / ANIMATION_MS) * 100, 100))
    }, 50)

    /* Scanning feed animation */
    const tickInterval = setInterval(() => {
      if (!configRef.current) return
      const participants = configRef.current.participants
      const p  = participants[Math.floor(Math.random() * participants.length)]
      setTicketId(p.ticketId)
      setFeedItems(prev => [{ id: p.ticketId, name: p.name }, ...prev].slice(0, 8))
    }, TICK_MS)

    /* After animation, "reveal" winner and navigate */
    const navTimer = setTimeout(() => {
      clearInterval(tickInterval)
      clearInterval(progressInterval)
      setProgress(100)
      setWinnerFound(true)
      setWinnerName(result.winners[0]?.participant.name ?? '')
      setTimeout(() => router.push('/results'), 1800)
    }, ANIMATION_MS)

    return () => {
      clearInterval(tickInterval)
      clearInterval(progressInterval)
      clearTimeout(navTimer)
    }
  }, [router])

  function cancelDraw() {
    setCancelled(true)
    router.replace('/')
  }

  if (cancelled) return null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex justify-between items-center px-10 py-5 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-sm">
        <h2
          className="text-[28px] font-extrabold text-primary"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          Draw in Progress
        </h2>
        <div className="flex items-center gap-3 text-[13px] font-semibold text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          LIVE
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-0.5 bg-surface-container-high">
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 px-10 py-8 max-w-[1200px] mx-auto w-full">
        <div className="flex gap-6 h-full" style={{ minHeight: '70vh' }}>

          {/* Left: Focus stage */}
          <div className="flex-[2] flex flex-col gap-5">
            {/* Prize banner */}
            <div className="glass-card rounded-xl p-7 overflow-hidden relative border-l-4 border-primary">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <span className="material-symbols-outlined text-[100px] text-primary">stars</span>
              </div>
              <p className="text-[11px] font-bold text-primary tracking-[0.15em] uppercase mb-2">
                Now Drawing
              </p>
              <h3
                className="text-[32px] font-extrabold text-on-surface"
                style={{ fontFamily: 'var(--font-sora)' }}
              >
                {currentTier}
              </h3>
              <p className="text-[15px] text-on-surface-variant mt-1">
                {configRef.current?.drawName ?? '…'}
              </p>
            </div>

            {/* Circular animation stage */}
            <div className="flex-1 glass-card rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,214,133,0.05)_0%,transparent_70%)]" />

              <div className="relative z-10 text-center space-y-8">
                {/* Ring */}
                <div className="w-60 h-60 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
                  {!winnerFound && (
                    <div
                      className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin"
                      style={{ animationDuration: '1.4s' }}
                    />
                  )}
                  <div
                    className={`w-44 h-44 rounded-full bg-surface-container-highest flex flex-col items-center justify-center ${
                      winnerFound ? 'ring-4 ring-primary/50' : 'pulse-gold'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-primary text-5xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {winnerFound ? 'emoji_events' : 'groups'}
                    </span>
                  </div>
                </div>

                {/* Status text */}
                <div className="space-y-2">
                  <h4
                    className={`text-[22px] font-semibold transition-colors ${
                      winnerFound ? 'text-primary' : 'text-on-surface'
                    }`}
                    style={{ fontFamily: 'var(--font-sora)' }}
                  >
                    {winnerFound ? `Winner: ${winnerName}` : 'Selecting winner…'}
                  </h4>
                  <p className="text-[14px] text-on-surface-variant">
                    Scanning {configRef.current?.participants.length ?? 0} verified entries
                  </p>
                </div>

                {/* Live ticket counter */}
                <div className="flex gap-3 items-center justify-center">
                  <div
                    className={`px-6 py-2 rounded-full border transition-all duration-300 ${
                      winnerFound
                        ? 'bg-primary border-primary scale-110'
                        : 'bg-surface-container-high border-outline-variant'
                    }`}
                  >
                    <span
                      className={`text-[20px] font-extrabold tracking-[0.1em] ${
                        winnerFound ? 'text-on-primary' : 'text-primary'
                      }`}
                      style={{ fontFamily: 'var(--font-sora)' }}
                    >
                      {ticketId}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live feed */}
          <div className="flex-1 glass-card rounded-xl flex flex-col overflow-hidden">
            {/* Feed header */}
            <div className="p-5 border-b border-outline-variant bg-surface-container-high/50 flex justify-between items-center">
              <h5 className="text-[17px] font-semibold text-on-surface" style={{ fontFamily: 'var(--font-sora)' }}>
                Scanning Feed
              </h5>
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[11px] font-bold">
                LIVE
              </span>
            </div>

            {/* Feed items */}
            <div
              className="flex-1 overflow-hidden p-5 space-y-3"
              style={{ maskImage: 'linear-gradient(to bottom,transparent,black 15%,black 85%,transparent)' }}
            >
              {feedItems.map((item, i) => (
                <div
                  key={`${item.id}-${i}`}
                  className="ticket-scan-row flex items-center justify-between p-3.5 bg-surface-container-low/40 rounded-lg border border-outline-variant/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                    <div>
                      <p
                        className="text-[13px] font-extrabold text-primary tracking-[0.1em]"
                        style={{ fontFamily: 'var(--font-sora)' }}
                      >
                        {item.id}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">{item.name}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-primary/60 font-bold uppercase">Scanning</span>
                </div>
              ))}
            </div>

            {/* Cancel */}
            <div className="p-5 bg-surface-container-high/50 space-y-3">
              <button
                onClick={cancelDraw}
                className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-error/40 text-error font-bold rounded-lg hover:bg-error/10 transition-all text-[14px]"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                Cancel Draw
              </button>
              <p className="text-[11px] text-center text-on-surface-variant opacity-50 uppercase tracking-wider">
                Secure cryptographic selection in progress
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
