'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Tier, Participant } from '@/app/types'
import { buildParticipants } from '@/lib/raffle'
import { saveDrawConfig } from '@/lib/storage'

const TIER_LABELS = ['Grand Prize', 'Gold Tier', 'Silver Tier', 'Bronze Tier', 'Special Prize']

const DEFAULT_TIERS: Tier[] = [
  { id: '1', number: '#01', name: '', prize: '', winners: 1  },
  { id: '2', number: '#02', name: '', prize: '', winners: 5  },
  { id: '3', number: '#03', name: '', prize: '', winners: 10 },
]

export default function SetupPage() {
  const router        = useRouter()
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const drawNameRef   = useRef<HTMLInputElement>(null)

  const [drawName,     setDrawName]     = useState('')
  const [tiers,        setTiers]        = useState<Tier[]>(DEFAULT_TIERS)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [fileName,     setFileName]     = useState('')
  const [dragActive,   setDragActive]   = useState(false)
  const [uploadError,  setUploadError]  = useState('')
  const [launching,    setLaunching]    = useState(false)

  const totalWinners = tiers.reduce((s, t) => s + t.winners, 0)

  /* ── Tier management ─────────────────────────────────── */
  function addTier() {
    const idx  = tiers.length
    const num  = `#${String(idx + 1).padStart(2, '0')}`
    const name = TIER_LABELS[idx] ?? `Tier ${idx + 1}`
    setTiers(prev => [
      ...prev,
      { id: crypto.randomUUID(), number: num, name, prize: 'Prize description', winners: 1 },
    ])
  }

  function removeTier(id: string) {
    setTiers(prev =>
      prev
        .filter(t => t.id !== id)
        .map((t, i) => ({ ...t, number: `#${String(i + 1).padStart(2, '0')}` }))
    )
  }

  function updateTier(id: string, field: keyof Tier, value: string | number) {
    setTiers(prev => prev.map(t => (t.id === id ? { ...t, [field]: value } : t)))
  }

  /* ── File parsing ────────────────────────────────────── */
  const parseFile = useCallback(async (file: File) => {
    setUploadError('')
    try {
      const ext = file.name.split('.').pop()?.toLowerCase()

      if (ext === 'csv' || ext === 'txt') {
        const Papa = (await import('papaparse')).default
        Papa.parse<Record<string, string>>(file, {
          header:         true,
          skipEmptyLines: true,
          complete: ({ data }) => {
            const parsed = buildParticipants(data)
            if (!parsed.length) {
              setUploadError('No valid rows found. Ensure the file has a "name" column.')
              return
            }
            setParticipants(parsed)
            setFileName(`${file.name} (${parsed.length} entries)`)
          },
          error: (err: Error) => setUploadError(`Parse error: ${err.message}`),
        })
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = await import('xlsx')
        const buf  = await file.arrayBuffer()
        const wb   = XLSX.read(buf, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws)
        const parsed = buildParticipants(rows)
        if (!parsed.length) {
          setUploadError('No valid rows found. Ensure the file has a "name" column.')
          return
        }
        setParticipants(parsed)
        setFileName(`${file.name} (${parsed.length} entries)`)
      } else {
        setUploadError('Unsupported format. Please upload a .csv or .xlsx file.')
      }
    } catch (e) {
      setUploadError('Failed to read file. Please try again.')
      console.error(e)
    }
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  /* ── Launch ──────────────────────────────────────────── */
  function launch() {
    if (!drawName.trim())      return alert('Please enter a draw name.')
    if (!participants.length)  return alert('Please upload a participant list.')
    if (participants.length < totalWinners)
      return alert(`Not enough participants (${participants.length}) for ${totalWinners} winners.`)

    setLaunching(true)
    saveDrawConfig({ drawName: drawName.trim(), tiers, participants })
    router.push('/draw')
  }

  /* ── Render ──────────────────────────────────────────── */
  return (
    <main className="px-10 py-12 max-w-[1200px] mx-auto">
      {/* Page header */}
      <header className="mb-12 text-center">
        <h2
          className="text-5xl font-extrabold text-primary uppercase tracking-tight mb-3"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          Set Up Your Raffle
        </h2>
        <p className="text-[17px] text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          Configure prize tiers, upload your eligible participant list, and execute your high-stakes draw in seconds.
        </p>
      </header>

      <div className="space-y-12">
        {/* Draw name */}
        <section className="space-y-3">
          <label className="block text-[12px] font-semibold text-on-surface-variant uppercase tracking-[0.12em]">
            Draw Name
          </label>
          <div className="relative">
            <input
              ref={drawNameRef}
              value={drawName}
              onChange={e => setDrawName(e.target.value)}
              placeholder="e.g. Annual Excellence Awards 2025"
              className="w-full bg-[#1a1a1a] border border-outline-variant text-on-surface px-6 py-5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-[17px] pr-12"
            />
            <button
              type="button"
              onClick={() => drawNameRef.current?.focus()}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40 hover:opacity-100 hover:text-primary transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
          </div>
        </section>

        {/* Prize Tiers */}
        <section className="space-y-5">
          <div className="flex justify-between items-end border-b border-outline-variant pb-4">
            <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-[0.12em]">
              Prize Tiers
            </label>
            <button
              onClick={addTier}
              className="flex items-center gap-1.5 text-primary hover:text-primary-container transition-colors text-[13px] font-semibold uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add New Tier
            </button>
          </div>

          <div className="grid gap-5">
            {tiers.map((tier, i) => (
              <TierCard
                key={tier.id}
                tier={tier}
                barOpacity={Math.max(1 - i * 0.3, 0.15)}
                onUpdate={(field, value) => updateTier(tier.id, field, value)}
                onRemove={() => removeTier(tier.id)}
              />
            ))}
          </div>

          <p className="text-right text-[15px] text-on-surface-variant">
            Total projected winners:{' '}
            <span className="text-primary font-bold">{totalWinners}</span>
          </p>
        </section>

        {/* Participant upload */}
        <section className="space-y-3">
          <label className="block text-[12px] font-semibold text-on-surface-variant uppercase tracking-[0.12em]">
            Participant List
          </label>

          <div
            onDragOver={e => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-all duration-300 ${
              dragActive || participants.length
                ? 'border-primary bg-primary/5'
                : 'border-outline-variant hover:border-primary bg-surface-container-low/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="mb-5 relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
              <div className="relative bg-surface-container-highest border border-outline-variant w-full h-full rounded-2xl flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-primary text-4xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  upload_file
                </span>
              </div>
            </div>

            {participants.length ? (
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-full">
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                <span className="text-[13px] font-semibold text-primary">{fileName}</span>
                <button
                  onClick={e => { e.stopPropagation(); setParticipants([]); setFileName('') }}
                  className="ml-1 text-on-surface-variant hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ) : (
              <>
                <h3
                  className="text-[22px] font-semibold text-on-surface mb-2"
                  style={{ fontFamily: 'var(--font-sora)' }}
                >
                  Drop participant list or click to browse
                </h3>
                <p className="text-[15px] text-on-surface-variant max-w-md mx-auto">
                  Accepts .xlsx, .csv, or .xls files.{' '}
                  Each row will be treated as one unique raffle entry.
                </p>
              </>
            )}

            {uploadError && (
              <p className="mt-4 text-error text-[13px]">{uploadError}</p>
            )}
          </div>
        </section>

        {/* Launch */}
        <section className="pt-4 pb-16">
          <button
            onClick={launch}
            disabled={launching}
            className="relative group w-full bg-primary text-on-primary py-6 rounded-xl font-bold text-[22px] uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(237,192,101,0.2)] hover:shadow-[0_0_60px_rgba(237,192,101,0.35)] transform transition-all hover:-translate-y-0.5 active:scale-[0.98] overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            <span className="shimmer-btn absolute inset-0 opacity-50" />
            <span className="relative z-10 flex items-center justify-center gap-4">
              {launching ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Preparing Draw…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    bolt
                  </span>
                  Launch Raffle Draw
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </span>
          </button>
          <p className="text-center mt-5 text-on-surface-variant text-[14px] opacity-60">
            Once launched, tiers cannot be edited. Ensure all configurations are correct.
          </p>
        </section>
      </div>
    </main>
  )
}

/* ── Tier Card sub-component ───────────────────────────────── */
function TierCard({
  tier,
  barOpacity,
  onUpdate,
  onRemove,
}: {
  tier: Tier
  barOpacity: number
  onUpdate: (field: keyof Tier, value: string | number) => void
  onRemove: () => void
}) {
  return (
    <div className="relative flex items-stretch bg-[#1a1a1a] border border-outline-variant rounded-xl overflow-hidden group hover:shadow-[0_0_20px_rgba(237,192,101,0.1)] hover:scale-[1.005] transition-all duration-300">
      {/* Gold accent bar */}
      <div className="absolute left-0 top-0 h-full w-2 bg-primary" style={{ opacity: barOpacity }} />

      {/* Tier info */}
      <div className="flex-1 flex items-center p-6 pl-8 gap-7">
        <div className="flex flex-col items-center min-w-[52px]" style={{ opacity: barOpacity }}>
          <span
            className="text-primary text-[20px] font-extrabold tracking-[0.1em]"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            {tier.number}
          </span>
          <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tight mt-0.5">
            {tier.name}
          </span>
        </div>

        <div className="flex-1 space-y-1">
          <input
            value={tier.prize}
            onChange={e => onUpdate('prize', e.target.value)}
            placeholder="Prize name…"
            className="bg-transparent p-0 text-[22px] font-semibold text-on-surface focus:ring-0 w-full outline-none border-none"
            style={{ fontFamily: 'var(--font-sora)' }}
          />
          <input
            value={tier.name}
            onChange={e => onUpdate('name', e.target.value)}
            placeholder="Tier label…"
            className="bg-transparent p-0 text-[14px] text-on-surface-variant focus:ring-0 w-full outline-none border-none"
          />
        </div>
      </div>

      {/* Perforation divider */}
      <div className="perforation self-stretch my-4" />

      {/* Winner count */}
      <div className="w-44 p-6 flex flex-col items-center justify-center bg-surface-container-high/40">
        <div className="flex items-baseline gap-1.5">
          <input
            type="number"
            min={0}
            value={tier.winners}
            onChange={e => {
              const v = parseInt(e.target.value) || 0
              if (v <= 0) { onRemove(); return }
              onUpdate('winners', v)
            }}
            className={`bg-transparent p-0 font-extrabold text-primary focus:ring-0 w-28 text-center outline-none border-none [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden ${
              tier.winners >= 1000 ? 'text-[28px]' : tier.winners >= 100 ? 'text-[36px]' : 'text-[44px]'
            }`}
            style={{ fontFamily: 'var(--font-sora)' }}
          />
          <span className="text-[12px] font-semibold text-on-surface-variant uppercase">
            {tier.winners === 1 ? 'Winner' : 'Winners'}
          </span>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => onUpdate('winners', tier.winners + 1)}
            className="p-1.5 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">keyboard_arrow_up</span>
          </button>
          <button
            onClick={() => tier.winners <= 1 ? onRemove() : onUpdate('winners', tier.winners - 1)}
            className="p-1.5 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
          </button>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
      >
        <span className="material-symbols-outlined text-error text-[20px]">close</span>
      </button>
    </div>
  )
}
