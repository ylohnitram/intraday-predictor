import { fetchKlines, type CandleData } from "./binance-api"

// Cache structure
interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

// Cache storage
const cache: Record<string, CacheItem<any>> = {}

// Cache duration in milliseconds
const CACHE_DURATIONS = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 4 * 60 * 60 * 1000, // 4 hours
  DAY: 24 * 60 * 60 * 1000, // 24 hours
}

/**
 * Get data from cache or fetch it if not available
 */
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  duration: number = CACHE_DURATIONS.MEDIUM,
): Promise<T> {
  const now = Date.now()

  // Check if data is in cache and not expired
  if (cache[key] && now < cache[key].expiry) {
    return cache[key].data
  }

  // Fetch fresh data
  try {
    const data = await fetchFn()

    // Store in cache
    cache[key] = {
      data,
      timestamp: now,
      expiry: now + duration,
    }

    return data
  } catch (error) {
    // If we have cached data but it's expired, return it anyway on error
    if (cache[key]) {
      console.warn(`Failed to fetch fresh data for ${key}, using expired cache`, error)
      return cache[key].data
    }

    // Otherwise, rethrow the error
    throw error
  }
}

/**
 * Clear specific cache item
 */
export function clearCache(key: string): void {
  delete cache[key]
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  Object.keys(cache).forEach((key) => delete cache[key])
}

/**
 * Get historical candle data with caching
 */
export async function getHistoricalData(
  timeframe: string,
  days: number,
  cacheDuration: number = CACHE_DURATIONS.MEDIUM,
): Promise<CandleData[]> {
  const limit = Math.min(1000, (days * 24 * 60) / getMinutesFromTimeframe(timeframe))
  const cacheKey = `klines_${timeframe}_${days}days`

  return getCachedData(cacheKey, () => fetchKlines(timeframe, limit), cacheDuration)
}

/**
 * Get minutes from timeframe string
 */
function getMinutesFromTimeframe(timeframe: string): number {
  switch (timeframe) {
    case "1m":
      return 1
    case "5m":
      return 5
    case "15m":
      return 15
    case "30m":
      return 30
    case "1h":
      return 60
    case "4h":
      return 240
    case "1d":
      return 1440
    default:
      return 30
  }
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

/**
 * Get date range for backtesting
 */
export function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)

  return { start, end }
}

export { CACHE_DURATIONS }

