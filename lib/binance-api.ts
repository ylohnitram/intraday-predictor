// Binance API client for fetching BTCUSDT perpetual futures data

export interface KlineData {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
  quoteAssetVolume: string
  trades: number
  takerBuyBaseAssetVolume: string
  takerBuyQuoteAssetVolume: string
  ignored: string
}

export interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TickerData {
  symbol: string
  price: string
  priceChangePercent: string
  volume?: string
  source?: string
}

// Convert timeframe to interval parameter for Binance API
export function timeframeToInterval(timeframe: string): string {
  switch (timeframe) {
    case "5m":
      return "5m"
    case "15m":
      return "15m"
    case "30m":
      return "30m"
    case "1h":
      return "1h"
    case "4h":
      return "4h"
    case "1d":
      return "1d"
    default:
      return "30m"
  }
}

export async function fetchKlines(
  interval: string,
  limit = 100,
  endTime?: number,
  symbol = "BTCUSDT",
): Promise<CandleData[]> {
  try {
    // Normalize the symbol - remove USDT/USD suffix for our API
    const normalizedSymbol = symbol.replace(/USDT$|USD$/, "")

    // Build URL with proper parameters for historical data
    let url = `/api/klines?symbol=${normalizedSymbol}&interval=${interval}&limit=${limit}`

    // Add end time if provided
    if (endTime) {
      url += `&endTime=${endTime}`
    }

    // Calculate start time based on interval and limit to ensure we get enough historical data
    const timeStep = getTimeStepSeconds(interval)
    const startTime = endTime ? endTime - limit * timeStep : Math.floor(Date.now() / 1000) - limit * timeStep
    url += `&startTime=${startTime}`

    console.log(`Fetching klines from internal API: ${url}`)

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      // Add a timeout to prevent hanging requests
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API returned ${response.status}: ${errorText}`)
    }

    const candles = await response.json()

    // Check if we received valid data
    if (!Array.isArray(candles) || candles.length === 0) {
      throw new Error("Invalid response from API")
    }

    return candles
  } catch (error) {
    console.error("Error fetching klines:", error)

    // Return mock data if API fails - with proper historical timestamps
    return generateHistoricalMockCandles(interval, limit, symbol, endTime)
  }
}

// Helper function to get time step in seconds for an interval
function getTimeStepSeconds(interval: string): number {
  switch (interval) {
    case "5m":
      return 300
    case "15m":
      return 900
    case "30m":
      return 1800
    case "1h":
      return 3600
    case "4h":
      return 14400
    case "1d":
      return 86400
    default:
      return 1800
  }
}

// Function to generate mock candle data with proper historical timestamps
function generateHistoricalMockCandles(
  interval: string,
  limit: number,
  symbol: string,
  endTime?: number,
): CandleData[] {
  const mockCandles: CandleData[] = []
  const end = endTime || Math.floor(Date.now() / 1000)

  // Determine base price based on symbol
  const basePrice = symbol.includes("BTC") ? 65000 : symbol.includes("ETH") ? 3500 : symbol.includes("SOL") ? 150 : 1000

  // Determine time step based on interval
  const timeStep = getTimeStepSeconds(interval)

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

// Add a function to generate sample candle data
function generateMockCandles(timeframe: string, limit: number, symbol = "BTC"): CandleData[] {
  const now = Math.floor(Date.now() / 1000)
  const data: CandleData[] = []

  // Determine interval in seconds
  let intervalSeconds: number
  switch (timeframe) {
    case "5m":
      intervalSeconds = 5 * 60
      break
    case "15m":
      intervalSeconds = 15 * 60
      break
    case "30m":
      intervalSeconds = 30 * 60
      break
    case "1h":
      intervalSeconds = 60 * 60
      break
    case "4h":
      intervalSeconds = 4 * 60 * 60
      break
    case "1d":
      intervalSeconds = 24 * 60 * 60
      break
    default:
      intervalSeconds = 30 * 60 // Default to 30m
  }

  // Start price based on symbol
  let price = symbol.includes("BTC")
    ? 86500
    : symbol.includes("ETH")
      ? 3500
      : symbol.includes("SOL")
        ? 150
        : symbol.includes("BNB")
          ? 600
          : symbol.includes("XRP")
            ? 0.5
            : symbol.includes("DOGE")
              ? 0.15
              : symbol.includes("ADA")
                ? 0.4
                : symbol.includes("AVAX")
                  ? 35
                  : symbol.includes("DOT")
                    ? 7
                    : symbol.includes("MATIC")
                      ? 0.8
                      : symbol.includes("LINK")
                        ? 15
                        : symbol.includes("LTC")
                          ? 80
                          : 10

  // Generate candles
  for (let i = 0; i < limit; i++) {
    // Time for this candle
    const time = now - (limit - i) * intervalSeconds

    // Random price movement (more volatile for shorter timeframes)
    const volatility =
      timeframe === "5m"
        ? 0.003
        : timeframe === "15m"
          ? 0.005
          : timeframe === "30m"
            ? 0.007
            : timeframe === "1h"
              ? 0.01
              : timeframe === "4h"
                ? 0.015
                : 0.02

    const change = price * volatility * (Math.random() * 2 - 1)

    // Calculate OHLC
    const open = price
    price = price + change
    const close = price
    const high = Math.max(open, close) + Math.abs(change) * Math.random() * 0.5
    const low = Math.min(open, close) - Math.abs(change) * Math.random() * 0.5

    // Random volume
    const volume = 10 + Math.random() * 90

    data.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    })
  }

  return data
}

// Add a function to validate ticker data
export function isValidTickerData(data: TickerData | null): boolean {
  if (!data) return false
  if (!data.price || data.price === "0" || data.price === "0.00") return false
  if (!data.priceChangePercent) return false
  return true
}

export async function fetchTickerData(symbol = "BTCUSDT"): Promise<TickerData> {
  try {
    // Ensure symbol is properly formatted
    if (!symbol.endsWith("USDT") && !symbol.endsWith("USD")) {
      symbol = `${symbol}USDT`
    }

    // Use our internal API route instead of calling Binance directly
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(`/api/ticker?symbol=${symbol}`, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Even if we get a non-200 response, try to parse the JSON
    // as our API should always return valid JSON even in error cases
    const data = await response.json()

    // Check if we got valid data
    if (!data || !data.price) {
      console.warn("Invalid ticker data received:", data)
      throw new Error("Invalid ticker data received")
    }

    // Store the data in localStorage for future fallback
    try {
      localStorage.setItem(`last${symbol}Price`, data.price)
      localStorage.setItem(`last${symbol}Change`, data.priceChangePercent)
    } catch (e) {
      // Ignore localStorage errors
    }

    return {
      symbol: data.symbol || symbol,
      price: data.price,
      priceChangePercent: data.priceChangePercent || "0.00",
      volume: data.volume || "0",
      source: data.source || "api",
    }
  } catch (error) {
    console.error("Error fetching ticker data:", error)

    // Try to get the last known price from localStorage as a fallback
    let fallbackPrice = "65000.00"
    let fallbackChange = "0.00"

    try {
      const storedPrice = localStorage.getItem(`last${symbol}Price`)
      const storedChange = localStorage.getItem(`last${symbol}Change`)

      if (storedPrice) {
        fallbackPrice = storedPrice
      }

      if (storedChange) {
        fallbackChange = storedChange
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    // Return fallback data in case of error
    return {
      symbol: symbol,
      price: fallbackPrice,
      priceChangePercent: fallbackChange,
      volume: "0",
      source: "client-fallback",
    }
  }
}

// Fetch ticker data from Binance
export async function fetchBinanceTicker(symbol = "BTCUSDT"): Promise<any> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      throw new Error(`Binance API returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching from Binance ticker API:", error)
    throw error
  }
}

// Fetch candle data from Binance
export async function fetchBinanceCandles(
  symbol = "BTCUSDT",
  interval = "4h",
  limit = 100,
  startTime?: number,
  endTime?: number,
): Promise<CandleData[]> {
  try {
    // Ensure proper symbol format
    if (!symbol.endsWith("USDT") && !symbol.endsWith("USD")) {
      symbol = `${symbol}USDT`
    }

    // Build URL with proper parameters
    const url = new URL("https://api.binance.com/api/v3/klines")
    url.searchParams.append("symbol", symbol)
    url.searchParams.append("interval", interval)
    url.searchParams.append("limit", limit.toString())

    // Add time parameters if provided
    if (startTime) {
      url.searchParams.append("startTime", startTime.toString())
    }

    if (endTime) {
      url.searchParams.append("endTime", endTime.toString())
    }

    console.log(`Fetching Binance candles: ${url.toString()}`)

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Binance API returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      throw new Error(`Invalid response from Binance API: ${JSON.stringify(data)}`)
    }

    // Transform Binance data to our format
    return data.map((item: any) => ({
      time: Math.floor(item[0] / 1000), // Convert milliseconds to seconds
      open: Number.parseFloat(item[1]),
      high: Number.parseFloat(item[2]),
      low: Number.parseFloat(item[3]),
      close: Number.parseFloat(item[4]),
      volume: Number.parseFloat(item[5]),
    }))
  } catch (error) {
    console.error("Error fetching from Binance klines API:", error)
    throw error
  }
}

// Modify the createTickerWebSocket function
export function createTickerWebSocket(
  symbol = "BTC",
  onMessage: (data: TickerData) => void,
  onError?: (error: Event) => void,
): WebSocket | null {
  // Check if we're in a browser environment (WebSocket is not available during SSR)
  if (typeof window === "undefined") {
    console.log("WebSocket not created - running in SSR context")
    return null
  }

  let socket: WebSocket | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  const symbolPair = `${symbol}usdt`

  const connect = () => {
    try {
      // Create WebSocket connection
      socket = new WebSocket(`wss://fstream.binance.com/ws/${symbolPair}@ticker`)

      socket.onopen = () => {
        console.log(`Ticker WebSocket connected for ${symbol}`)
        reconnectAttempts = 0 // Reset reconnect attempts on successful connection
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Validate the data before passing it to the callback
          if (isValidTickerData(data)) {
            onMessage(data as TickerData)
          } else {
            console.warn("Received invalid ticker data:", data)
          }
        } catch (error) {
          console.error("Error processing ticker WebSocket message:", error)
        }
      }

      socket.onerror = (error) => {
        console.error("Ticker WebSocket error:", error)
        if (onError) {
          onError(error)
        }
      }

      // Add reconnection logic
      socket.onclose = (event) => {
        console.log(`Ticker WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`)

        // Only attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000) // Exponential backoff with 30s max
          console.log(
            `Attempting to reconnect in ${delay / 1000}s... (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`,
          )

          setTimeout(() => {
            console.log("Reconnecting ticker WebSocket...")
            connect()
          }, delay)
        } else {
          console.log("Maximum reconnection attempts reached. Giving up.")
        }
      }
    } catch (error) {
      console.error("Error creating WebSocket:", error)
      return null
    }

    return socket
  }

  return connect()
}

// Create a WebSocket connection for real-time kline updates
export function createKlineWebSocket(
  timeframe: string,
  onMessage: (data: CandleData) => void,
  onError?: (error: Event) => void,
  symbol = "BTC",
): WebSocket | null {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    console.log("WebSocket not created - running in SSR context")
    return null
  }

  const interval = timeframeToInterval(timeframe)
  const symbolPair = `${symbol.toLowerCase()}usdt`
  let socket: WebSocket | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5

  const connect = () => {
    try {
      // Close existing socket if it exists
      if (socket) {
        try {
          socket.close()
        } catch (e) {
          console.error("Error closing existing socket:", e)
        }
      }

      socket = new WebSocket(`wss://fstream.binance.com/ws/${symbolPair}@kline_${interval}`)

      socket.onopen = () => {
        console.log(`Kline WebSocket connected for ${symbol} ${interval} timeframe`)
        reconnectAttempts = 0
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.k) {
            const kline = data.k
            const candle: CandleData = {
              time: kline.t / 1000, // Convert to seconds for chart library
              open: Number.parseFloat(kline.o),
              high: Number.parseFloat(kline.h),
              low: Number.parseFloat(kline.l),
              close: Number.parseFloat(kline.c),
              volume: Number.parseFloat(kline.v),
            }
            onMessage(candle)
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error)
        }
      }

      socket.onerror = (error) => {
        console.error("WebSocket error:", error)
        if (onError) {
          onError(error)
        }

        // Try to reconnect on error
        if (socket) {
          try {
            socket.close()
          } catch (e) {
            console.error("Error closing socket after error:", e)
          }
        }
      }

      socket.onclose = (event) => {
        console.log(`Kline WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`)

        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
          console.log(
            `Attempting to reconnect in ${delay / 1000}s... (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`,
          )

          setTimeout(() => {
            console.log("Reconnecting kline WebSocket...")
            connect()
          }, delay)
        } else {
          console.log("Maximum reconnection attempts reached. Using fallback data.")
          // Generate a sample candle every 30 seconds as fallback
          const fallbackInterval = setInterval(() => {
            const sampleCandle = generateSampleCandle(timeframe, symbol)
            onMessage(sampleCandle)
          }, 30000)

          // Clean up interval after 5 minutes
          setTimeout(
            () => {
              clearInterval(fallbackInterval)
            },
            5 * 60 * 1000,
          )
        }
      }
    } catch (error) {
      console.error("Error creating WebSocket:", error)
      return null
    }

    return socket
  }

  return connect()
}

// Helper function to generate a single sample candle
function generateSampleCandle(timeframe: string, symbol = "BTC"): CandleData {
  const now = Math.floor(Date.now() / 1000)

  // Use the last known price or a default
  let lastPrice =
    symbol === "BTC"
      ? 86500
      : symbol === "ETH"
        ? 3500
        : symbol === "SOL"
          ? 150
          : symbol === "BNB"
            ? 600
            : symbol === "XRP"
              ? 0.5
              : symbol === "DOGE"
                ? 0.15
                : symbol === "ADA"
                  ? 0.4
                  : symbol === "AVAX"
                    ? 35
                    : symbol === "DOT"
                      ? 7
                      : symbol === "MATIC"
                        ? 0.8
                        : symbol === "LINK"
                          ? 15
                          : symbol === "LTC"
                            ? 80
                            : 10

  try {
    // Try to get the last price from localStorage if available
    const storedPrice = localStorage.getItem(`last${symbol}Price`)
    if (storedPrice) {
      lastPrice = Number(storedPrice)
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  // Random price movement (more volatile for shorter timeframes)
  const volatility =
    timeframe === "5m"
      ? 0.001
      : timeframe === "15m"
        ? 0.002
        : timeframe === "30m"
          ? 0.003
          : timeframe === "1h"
            ? 0.005
            : timeframe === "4h"
              ? 0.008
              : 0.01

  const change = lastPrice * volatility * (Math.random() * 2 - 1)

  // Calculate OHLC
  const open = lastPrice
  const close = lastPrice + change
  const high = Math.max(open, close) + Math.abs(change) * Math.random() * 0.5
  const low = Math.min(open, close) - Math.abs(change) * Math.random() * 0.5

  // Random volume
  const volume = 10 + Math.random() * 90

  // Store the new price for next time
  try {
    localStorage.setItem(`last${symbol}Price`, close.toString())
  } catch (e) {
    // Ignore localStorage errors
  }

  return {
    time: now,
    open,
    high,
    low,
    close,
    volume,
  }
}

