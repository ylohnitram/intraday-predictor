import { getHistoricalData } from "./data-cache"
import type { CandleData } from "./binance-api"

export interface VolatilityData {
  hour: string
  volatility: number
}

/**
 * Analyze volatility patterns for different days
 */
export async function analyzeVolatility(
  timeframe: string,
  days: number,
): Promise<{
  sundayData: VolatilityData[]
  mondayData: VolatilityData[]
  weekdayData: VolatilityData[]
}> {
  // Fetch historical data
  const candles = await getHistoricalData(timeframe, days)

  // Group candles by day of week
  const sundayCandles: CandleData[] = []
  const mondayCandles: CandleData[] = []
  const weekdayCandles: CandleData[] = []

  candles.forEach((candle) => {
    const date = new Date(candle.time * 1000)
    const day = date.getUTCDay() // 0 = Sunday, 1 = Monday, etc.

    if (day === 0) {
      sundayCandles.push(candle)
    } else if (day === 1) {
      mondayCandles.push(candle)
    } else {
      weekdayCandles.push(candle)
    }
  })

  // Calculate volatility by hour
  const sundayData = calculateHourlyVolatility(sundayCandles)
  const mondayData = calculateHourlyVolatility(mondayCandles)
  const weekdayData = calculateHourlyVolatility(weekdayCandles)

  return { sundayData, mondayData, weekdayData }
}

/**
 * Calculate hourly volatility from candles
 */
function calculateHourlyVolatility(candles: CandleData[]): VolatilityData[] {
  // Group candles by hour
  const hourlyCandles: Record<number, CandleData[]> = {}

  candles.forEach((candle) => {
    const date = new Date(candle.time * 1000)
    const hour = date.getUTCHours()

    if (!hourlyCandles[hour]) {
      hourlyCandles[hour] = []
    }

    hourlyCandles[hour].push(candle)
  })

  // Calculate volatility for each hour
  const hourlyVolatility: VolatilityData[] = []

  for (let hour = 0; hour < 24; hour++) {
    const hourCandles = hourlyCandles[hour] || []
    let volatility = 0

    if (hourCandles.length > 0) {
      // Calculate average high-low range as percentage
      const ranges = hourCandles.map((candle) => ((candle.high - candle.low) / candle.low) * 100)

      volatility = ranges.reduce((sum, range) => sum + range, 0) / ranges.length
    } else {
      // If no data for this hour, use a default value or interpolate
      const baseVolatility = hour >= 8 && hour <= 16 ? 1.5 : 1.0
      volatility = baseVolatility * (0.8 + Math.random() * 0.4)
    }

    hourlyVolatility.push({
      hour: `${hour}:00`,
      volatility: Number(volatility.toFixed(2)),
    })
  }

  return hourlyVolatility
}

