import { type NextRequest, NextResponse } from "next/server"
import { fetchBinanceCandles, type CandleData } from "@/lib/binance-api"
import { getCachedCandles, setCachedCandles } from "@/lib/redis"

// Function to get candles from cache
async function getCandlesFromCache(symbol: string, interval: string, limit: number): Promise<CandleData[] | null> {
  try {
    const cachedData = await getCachedCandles(symbol, interval, limit)

    if (!cachedData) {
      console.log(`No cached candle data found for ${symbol}:${interval}:${limit}`)
      return null
    }

    console.log(`Retrieved cached candle data for ${symbol}:${interval}:${limit}`)
    return cachedData
  } catch (error) {
    console.error("Error getting candles from cache:", error)
    return null
  }
}

// Function to get candles from Binance
async function getCandles(
  symbol: string,
  interval: string,
  limit: number,
  startTime?: number,
  endTime?: number,
): Promise<CandleData[] | null> {
  try {
    // Ensure proper symbol format for Binance API
    const formattedSymbol = symbol.endsWith("USDT") ? symbol : `${symbol}USDT`

    console.log(`Fetching candles from Binance for ${formattedSymbol}:${interval}:${limit}`)

    const candles = await fetchBinanceCandles(
      formattedSymbol,
      interval,
      limit,
      startTime ? startTime * 1000 : undefined, // Convert to milliseconds for Binance API
      endTime ? endTime * 1000 : undefined, // Convert to milliseconds for Binance API
    )

    if (!candles || candles.length === 0) {
      console.warn(`No candle data returned from Binance for ${formattedSymbol}:${interval}:${limit}`)
      return null
    }

    // Cache the results
    await setCachedCandles(symbol, interval, limit, candles)

    return candles
  } catch (error) {
    console.error("Error fetching candles from Binance:", error)
    return null
  }
}

// Function to get candles from CryptoCompare as fallback
async function getCandlesFromCryptoCompare(
  symbol: string,
  interval: string,
  limit: number,
): Promise<CandleData[] | null> {
  try {
    // Map our interval to CryptoCompare's format
    let cryptoCompareInterval: string
    switch (interval) {
      case "5m":
        cryptoCompareInterval = "minute"
        limit = Math.min(limit, 2000) // CryptoCompare limit
        break
      case "30m":
        cryptoCompareInterval = "minute"
        limit = Math.min(limit * 6, 2000) // Adjust for 30m intervals
        break
      case "1h":
        cryptoCompareInterval = "hour"
        limit = Math.min(limit, 2000)
        break
      case "4h":
        cryptoCompareInterval = "hour"
        limit = Math.min(limit * 4, 2000) // Adjust for 4h intervals
        break
      case "1d":
        cryptoCompareInterval = "day"
        limit = Math.min(limit, 2000)
        break
      default:
        cryptoCompareInterval = "hour"
        limit = Math.min(limit, 2000)
    }

    // Adjust the aggregate parameter based on interval
    const aggregate = interval === "30m" ? 30 : interval === "4h" ? 4 : 1

    const url = `https://min-api.cryptocompare.com/data/v2/histo${cryptoCompareInterval}?fsym=${symbol}&tsym=USDT&limit=${limit}&aggregate=${aggregate}`

    console.log(`Fetching candles from CryptoCompare: ${url}`)

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      throw new Error(`CryptoCompare API returned ${response.status}`)
    }

    const data = await response.json()

    if (!data.Data || !data.Data.Data || !Array.isArray(data.Data.Data) || data.Data.Data.length === 0) {
      console.warn("Invalid or empty response from CryptoCompare")
      return null
    }

    // Transform CryptoCompare data to our format
    const candles: CandleData[] = data.Data.Data.map((item: any) => ({
      time: item.time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volumefrom,
    }))

    // Cache the results
    await setCachedCandles(symbol, interval, limit, candles)

    return candles
  } catch (error) {
    console.error("Error fetching candles from CryptoCompare:", error)
    return null
  }
}

// Function to generate mock candle data as a last resort
function generateMockCandles(
  symbol: string,
  interval: string,
  limit: number,
  startTime?: number,
  endTime?: number,
): CandleData[] {
  console.log(`Generating mock candles for ${symbol}:${interval}:${limit}`)

  const mockCandles: CandleData[] = []
  const end = endTime || Math.floor(Date.now() / 1000)

  // Determine base price based on symbol
  const basePrice = symbol.includes("BTC") ? 65000 : symbol.includes("ETH") ? 3500 : symbol.includes("SOL") ? 150 : 1000

  // Determine time step based on interval
  let timeStep: number
  switch (interval) {
    case "5m":
      timeStep = 300
      break
    case "15m":
      timeStep = 900
      break
    case "30m":
      timeStep = 1800
      break
    case "1h":
      timeStep = 3600
      break
    case "4h":
      timeStep = 14400
      break
    case "1d":
      timeStep = 86400
      break
    default:
      timeStep = 1800 // Default to 30m
  }

  // Generate a realistic price trend
  let price = basePrice
  let trend = 0
  let trendStrength = 0
  let trendDuration = 0

  for (let i = 0; i < limit; i++) {
    // Time for this candle - going backwards from end time
    const time = end - (limit - i) * timeStep

    // Update trend occasionally
    if (trendDuration <= 0) {
      trend = Math.random() > 0.5 ? 1 : -1
      trendStrength = Math.random() * 0.01
      trendDuration = Math.floor(Math.random() * 10) + 5
    }
    trendDuration--

    // Apply trend with some randomness
    const trendEffect = trend * trendStrength * basePrice
    const randomness = basePrice * 0.01 * (Math.random() * 2 - 1)
    price = price + trendEffect + randomness

    // Ensure price doesn't go too low
    price = Math.max(price, basePrice * 0.5)

    // Calculate OHLC with realistic patterns
    const volatility =
      basePrice * (interval === "5m" ? 0.005 : interval === "30m" ? 0.01 : interval === "4h" ? 0.02 : 0.03)
    const open = price
    const close = price * (1 + (Math.random() * 0.02 - 0.01) + trend * 0.005)
    const high = Math.max(open, close) * (1 + Math.random() * 0.01)
    const low = Math.min(open, close) * (1 - Math.random() * 0.01)

    // Volume tends to be higher during price movements
    const volumeBaseValue = (Math.abs(close - open) / volatility) * 1000
    const volume = volumeBaseValue + Math.random() * 500

    mockCandles.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    })

    // Update price for next iteration
    price = close
  }

  return mockCandles
}

// Function to try all data sources in order
async function tryAllDataSources(
  symbol: string,
  interval: string,
  limit: number,
  startTime?: number,
  endTime?: number,
): Promise<CandleData[]> {
  // Try cache first
  try {
    const cachedCandles = await getCandlesFromCache(symbol, interval, limit)
    if (cachedCandles && cachedCandles.length > 0) {
      return cachedCandles
    }
  } catch (error) {
    console.error("Error getting candles from cache:", error)
  }

  // Try Binance
  try {
    const binanceCandles = await getCandles(symbol, interval, limit, startTime, endTime)
    if (binanceCandles && binanceCandles.length > 0) {
      return binanceCandles
    }
  } catch (error) {
    console.error("Error getting candles from Binance:", error)
  }

  // Try CryptoCompare
  try {
    const cryptoCompareCandles = await getCandlesFromCryptoCompare(symbol, interval, limit)
    if (cryptoCompareCandles && cryptoCompareCandles.length > 0) {
      return cryptoCompareCandles
    }
  } catch (error) {
    console.error("Error getting candles from CryptoCompare:", error)
  }

  // Fall back to mock data as last resort
  return generateMockCandles(symbol, interval, limit, startTime, endTime)
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get("symbol") || "BTC"
    const interval = searchParams.get("interval") || "30m"
    const limit = Number.parseInt(searchParams.get("limit") || "100", 10)
    const startTime = searchParams.get("startTime")
      ? Number.parseInt(searchParams.get("startTime") as string, 10)
      : undefined
    const endTime = searchParams.get("endTime") ? Number.parseInt(searchParams.get("endTime") as string, 10) : undefined

    // Validate parameters
    if (isNaN(limit) || limit <= 0 || limit > 1000) {
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 })
    }

    if (startTime && isNaN(startTime)) {
      return NextResponse.json({ error: "Invalid startTime parameter" }, { status: 400 })
    }

    if (endTime && isNaN(endTime)) {
      return NextResponse.json({ error: "Invalid endTime parameter" }, { status: 400 })
    }

    // Try all data sources
    const candles = await tryAllDataSources(symbol, interval, limit, startTime, endTime)

    return NextResponse.json(candles)
  } catch (error) {
    console.error("Error in klines API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

