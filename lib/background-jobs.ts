import { fetchBinanceCandles, fetchBinanceTicker } from "./binance-api"
import { setCachedCandles, setCachedTicker, needsRefresh } from "./redis"

// Default support and resistance levels (these would ideally be calculated algorithmically)
export const defaultSupportResistanceLevels = [
  {
    type: "support",
    priceStart: 64000,
    priceEnd: 63500,
    description: "Strong support zone",
    strength: "strong",
  },
  {
    type: "resistance",
    priceStart: 68000,
    priceEnd: 68500,
    description: "Key resistance level",
    strength: "medium",
  },
  {
    type: "support",
    priceStart: 61000,
    priceEnd: 60500,
    description: "Previous ATH support",
    strength: "medium",
  },
]

// Function to update ticker data if needed
export async function updateTickerIfNeeded(symbol = "BTCUSDT"): Promise<void> {
  try {
    // Check if we need to refresh the data
    const needsUpdate = await needsRefresh("ticker", 60, { symbol })

    if (needsUpdate) {
      console.log(`Updating ticker data for ${symbol}...`)
      const tickerData = await fetchBinanceTicker(symbol)
      await setCachedTicker(symbol, tickerData)
      console.log(`Ticker data updated for ${symbol}`)
    }
  } catch (error) {
    console.error("Error updating ticker data:", error)
  }
}

// Function to update candle data if needed
export async function updateCandlesIfNeeded(
  symbol = "BTCUSDT",
  intervals: string[] = ["5m", "30m", "4h", "1d"],
): Promise<void> {
  try {
    for (const interval of intervals) {
      // Determine max age based on interval
      let maxAge = 60 * 5 // 5 minutes default
      if (interval === "5m") maxAge = 60 * 5
      else if (interval === "30m") maxAge = 60 * 15
      else if (interval === "4h") maxAge = 60 * 60 * 2
      else if (interval === "1d") maxAge = 60 * 60 * 12

      const needsUpdate = await needsRefresh("candles", maxAge, { symbol, interval })

      if (needsUpdate) {
        console.log(`Updating ${interval} candles for ${symbol}...`)
        const limit = interval === "5m" ? 200 : interval === "30m" ? 150 : interval === "1d" ? 60 : 100
        const candles = await fetchBinanceCandles(symbol, interval, limit)
        await setCachedCandles(symbol, interval, limit, candles)
        console.log(`${interval} candles updated for ${symbol}`)
      }
    }
  } catch (error) {
    console.error("Error updating candle data:", error)
  }
}

// Main function to update all data
export async function updateAllData(): Promise<void> {
  await updateTickerIfNeeded()
  await updateCandlesIfNeeded()
}

