import type { DrawConfig, DrawResult } from '@/app/types'

const CONFIG_KEY = 'eg_draw_config'
const RESULT_KEY = 'eg_draw_result'

export function saveDrawConfig(config: DrawConfig): void {
  sessionStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export function loadDrawConfig(): DrawConfig | null {
  try {
    const raw = sessionStorage.getItem(CONFIG_KEY)
    return raw ? (JSON.parse(raw) as DrawConfig) : null
  } catch {
    return null
  }
}

export function saveDrawResult(result: DrawResult): void {
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result))
}

export function loadDrawResult(): DrawResult | null {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY)
    return raw ? (JSON.parse(raw) as DrawResult) : null
  } catch {
    return null
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(CONFIG_KEY)
  sessionStorage.removeItem(RESULT_KEY)
}
