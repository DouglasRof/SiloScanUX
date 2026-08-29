export const HISTORY_RANGES = {
  '24h': { label: '24H', windowMs: 24 * 3_600_000 },
  '7d': { label: '7D', windowMs: 7 * 24 * 3_600_000 },
} as const

export type HistoryRange = keyof typeof HISTORY_RANGES
