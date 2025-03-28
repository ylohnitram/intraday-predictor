import type { CandleData } from "./binance-api"

interface VolumeProfile {
  price: number
  volume: number
}

export interface SRZone {
  min: number
  max: number
  type: "support" | "resistance"
  strength: number
}

// Calculate volume profile from candle data
export async function calculateVolumeProfile(candles: CandleData[]): Promise<VolumeProfile[]> {
  if (!candles || candles.length === 0) return []

  // Find min and max prices
  const minPrice = Math.min(...candles.map((c) => c.low))
  const maxPrice = Math.max(...candles.map((c) => c.high))

  // Calculate price range size (divide the range into 100 buckets)
  const priceRanges = 100
  const rangeSize = (maxPrice - minPrice) / priceRanges

  // Initialize volume profile
  const volumeProfile: VolumeProfile[] = Array.from({ length: priceRanges }, (_, i) => ({
    price: minPrice + i * rangeSize + rangeSize / 2, // Middle of the range
    volume: 0,
  }))

  // Distribute volume across price ranges
  candles.forEach((candle) => {
    // For each candle, distribute its volume across the price ranges it spans
    const candleRange = candle.high - candle.low

    // Simple approach: distribute volume equally across the price range
    for (let i = 0; i < volumeProfile.length; i++) {
      const rangeMin = minPrice + i * rangeSize
      const rangeMax = rangeMin + rangeSize

      // Check if this price range overlaps with the candle
      if (rangeMax >= candle.low && rangeMin <= candle.high) {
        // Calculate overlap percentage
        const overlapStart = Math.max(rangeMin, candle.low)
        const overlapEnd = Math.min(rangeMax, candle.high)
        const overlapSize = overlapEnd - overlapStart
        const overlapPercentage = overlapSize / candleRange

        // Add proportional volume to this range
        volumeProfile[i].volume += candle.volume * overlapPercentage
      }
    }
  })

  return volumeProfile
}

// Find volume Point of Control (vPOC) - the price level with the highest volume
export function findVolumePointOfControl(volumeProfile: VolumeProfile[]): number {
  if (!volumeProfile || volumeProfile.length === 0) return 0

  const vPOC = volumeProfile.reduce((max, current) => (current.volume > max.volume ? current : max), volumeProfile[0])

  return vPOC.price
}

// Find support and resistance zones based on volume profile
export async function findSupportResistanceZones(candles: CandleData[], currentPrice: number): Promise<SRZone[]> {
  if (!candles || candles.length === 0) return []

  // Calculate volume profile
  const volumeProfile = await calculateVolumeProfile(candles)

  // Sort volume profile by volume (descending)
  const sortedProfile = [...volumeProfile].sort((a, b) => b.volume - a.volume)

  // Take top N volume clusters
  const topClusters = sortedProfile.slice(0, Math.min(10, sortedProfile.length))

  // Group nearby clusters
  const mergedClusters: VolumeProfile[] = []
  const priceThreshold = (Math.max(...candles.map((c) => c.high)) - Math.min(...candles.map((c) => c.low))) * 0.02 // 2% of range

  topClusters.forEach((cluster) => {
    // Check if this cluster is close to an existing merged cluster
    const existingCluster = mergedClusters.find((c) => Math.abs(c.price - cluster.price) < priceThreshold)

    if (existingCluster) {
      // Merge with existing cluster
      existingCluster.volume += cluster.volume
      existingCluster.price = (existingCluster.price + cluster.price) / 2 // Average price
    } else {
      // Add as new cluster
      mergedClusters.push({ ...cluster })
    }
  })

  // Sort merged clusters by price
  mergedClusters.sort((a, b) => a.price - b.price)

  // Identify support and resistance zones
  const zones: SRZone[] = []

  mergedClusters.forEach((cluster) => {
    // Determine if this is support or resistance based on current price
    const type = cluster.price < currentPrice ? "support" : "resistance"

    // Calculate zone boundaries (use a percentage of the price)
    const zoneSize = cluster.price * 0.01 // 1% of price for zone width

    zones.push({
      min: cluster.price - zoneSize,
      max: cluster.price + zoneSize,
      type,
      strength: cluster.volume, // Use volume as a proxy for strength
    })
  })

  // Sort zones by distance from current price
  zones.sort((a, b) => {
    const aMiddle = (a.min + a.max) / 2
    const bMiddle = (b.min + b.max) / 2
    return Math.abs(aMiddle - currentPrice) - Math.abs(bMiddle - currentPrice)
  })

  // Get top support and resistance zones
  const supportZones = zones.filter((z) => z.type === "support").slice(0, 2)
  const resistanceZones = zones.filter((z) => z.type === "resistance").slice(0, 2)

  return [...supportZones, ...resistanceZones]
}

