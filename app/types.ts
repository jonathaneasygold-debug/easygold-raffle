export interface Tier {
  id: string
  number: string   // '#01', '#02', etc.
  name: string     // 'Grand Prize', 'Gold Tier', etc.
  prize: string    // prize description
  winners: number
}

export interface Participant {
  name: string
  department: string
  ticketId: string // 'EG-001'
}

export interface DrawConfig {
  drawName: string
  tiers: Tier[]
  participants: Participant[]
}

export interface Winner {
  participant: Participant
  tier: Tier
  drawnAt: string
}

export interface DrawResult {
  id: string       // verification code, e.g. 'b7a8-44d2-99c1-ef02'
  drawName: string
  date: string     // ISO timestamp
  tiers: Tier[]
  winners: Winner[]
}

export interface HistoricalDraw {
  id: string
  drawName: string
  date: string
  totalWinners: number
  tiersCount: number
  winners: Winner[]
  tiers: Tier[]
}
