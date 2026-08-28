import type { FlowEstimate } from '../types/silo'

export interface FlowLogEntry {
  t: number
  deltaTon: number
}

const HOUR_MS = 3_600_000

export function computeFlowEstimate(
  log: FlowLogEntry[],
  massNowTon: number,
  capacityTon: number,
  now: number,
  lowThresholdPercent = 15,
): FlowEstimate {
  const hourAgo = now - HOUR_MS
  const recent = log.filter((e) => e.t >= hourAgo)
  const inflowLastHourTon = recent.filter((e) => e.deltaTon > 0).reduce((s, e) => s + e.deltaTon, 0)
  const outflowLastHourTon = recent.filter((e) => e.deltaTon < 0).reduce((s, e) => s - e.deltaTon, 0)

  const shortWindowStart = now - 10 * 60_000
  const shortLog = log.filter((e) => e.t >= shortWindowStart)
  const shortNet = shortLog.reduce((s, e) => s + e.deltaTon, 0)
  const shortHours = shortLog.length > 0 ? (now - shortLog[0].t) / HOUR_MS : 0
  // Require a couple of samples before trusting the short window — right after a reset
  // (flowLog cleared) one lone sample would extrapolate a noisy, over-confident rate.
  const netRateTonHour = shortLog.length >= 2 && shortHours > 0.001 ? shortNet / shortHours : inflowLastHourTon - outflowLastHourTon

  let hoursToEmpty: number | null = null
  let hoursToFull: number | null = null
  let refillEta: number | null = null

  if (netRateTonHour < -0.01) {
    hoursToEmpty = massNowTon / Math.abs(netRateTonHour)
    const lowTon = capacityTon * (lowThresholdPercent / 100)
    if (massNowTon > lowTon) {
      const hoursToLow = (massNowTon - lowTon) / Math.abs(netRateTonHour)
      refillEta = now + hoursToLow * HOUR_MS
    } else {
      refillEta = now
    }
  } else if (netRateTonHour > 0.01) {
    hoursToFull = Math.max(0, capacityTon - massNowTon) / netRateTonHour
  }

  return { inflowLastHourTon, outflowLastHourTon, netRateTonHour, hoursToEmpty, hoursToFull, refillEta }
}
