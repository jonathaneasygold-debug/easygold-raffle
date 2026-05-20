import type { Tier, Participant, DrawConfig, DrawResult, Winner } from '@/app/types'

function cryptoRandom(max: number): number {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] % max
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = cryptoRandom(i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function generateVerificationCode(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return [hex.slice(0, 4), hex.slice(4, 8), hex.slice(8, 12), hex.slice(12, 16)].join('-')
}

export function selectWinners(config: DrawConfig): DrawResult {
  const totalWinners = config.tiers.reduce((sum, t) => sum + t.winners, 0)

  if (config.participants.length < totalWinners) {
    throw new Error(
      `Not enough participants (${config.participants.length}) for ${totalWinners} winners`
    )
  }

  const shuffled = shuffle(config.participants)
  const winners: Winner[] = []
  let idx = 0
  const now = new Date().toISOString()

  for (const tier of config.tiers) {
    for (let i = 0; i < tier.winners; i++) {
      winners.push({ participant: shuffled[idx++], tier, drawnAt: now })
    }
  }

  return {
    id: generateVerificationCode(),
    drawName: config.drawName,
    date: now,
    tiers: config.tiers,
    winners,
  }
}

export function buildParticipants(
  rows: { name?: string; department?: string; Name?: string; Department?: string }[]
): Participant[] {
  return rows
    .map((row, i) => ({
      name:       (row.name ?? row.Name ?? '').trim(),
      department: (row.department ?? row.Department ?? '').trim(),
      ticketId:   `EG-${String(i + 1).padStart(3, '0')}`,
    }))
    .filter(p => p.name.length > 0)
}
