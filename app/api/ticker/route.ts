import { type NextRequest, NextResponse } from "next/server"
import { getCachedTicker, setCachedTicker } from "@/lib/redis"

// Fallback data in case everything fails
const FALLBACK_DATA = {
  symbol: "BTCUSDT",
  price: "65000.00",
  priceChangePercent: "0.00",
  volume: "10000.00",
  high: "65500.00",
  low: "64500.00",
  source: "fallback",
}

// Current market prices for major cryptocurrencies (updated manually)
const CURRENT_PRICES = {
  BTCUSDT: {
    price: "65000.00",
    priceChangePercent: "0.50",
    volume: "15000.00",
    high: "66000.00",
    low: "64000.00",
  },
  ETHUSDT: {
    price: "3500.00",
    priceChangePercent: "0.75",
    volume: "8000.00",
    high: "3550.00",
    low: "3450.00",
  },
  SOLUSDT: {
    price: "150.00",
    priceChangePercent: "1.20",
    volume: "5000.00",
    high: "155.00",
    low: "145.00",
  },
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    let symbol = searchParams.get("symbol") || "BTCUSDT"

    // Ensure symbol is properly formatted
    if (!symbol.endsWith("USDT") && !symbol.endsWith("USD")) {
      symbol = `${symbol}USDT`
    }

    // Try all data sources in sequence until one works
    const data = await tryAllDataSources(symbol)

    // Return the data
    return NextResponse.json(data)
  } catch (error) {
    console.error("Unhandled error in ticker API route:", error)

    // Always return a valid response, even in case of errors
    return NextResponse.json(FALLBACK_DATA, { status: 200 })
  }
}

async function tryAllDataSources(symbol: string) {
  // 1. Try to get cached data first (fastest response)
  try {
    const cachedData = await getCachedTicker(symbol)

    if (cachedData) {
      console.log(`Using cached data for ${symbol}`)
      return {
        symbol: cachedData.symbol || symbol,
        price: cachedData.price || cachedData.lastPrice || FALLBACK_DATA.price,
        priceChangePercent: cachedData.priceChangePercent || FALLBACK_DATA.priceChangePercent,
        volume: cachedData.volume || FALLBACK_DATA.volume,
        high: cachedData.high || cachedData.highPrice || FALLBACK_DATA.high,
        low: cachedData.low || cachedData.lowPrice || FALLBACK_DATA.low,
        source: "redis-cache",
      }
    }
  } catch (redisError) {
    console.error("Error fetching from Redis:", redisError)
  }

  // 2. Try CryptoCompare as a primary external source
  try {
    const cryptoCompareData = await fetchFromCryptoCompare(symbol)
    if (cryptoCompareData) {
      const data = {
        symbol: symbol,
        price: cryptoCompareData.PRICE.toString(),
        priceChangePercent: cryptoCompareData.CHANGEPCT24HOUR.toString(),
        volume: cryptoCompareData.VOLUME24HOUR.toString(),
        high: cryptoCompareData.HIGH24HOUR.toString(),
        low: cryptoCompareData.LOW24HOUR.toString(),
        source: "cryptocompare",
      }

      // Cache the successful response
      try {
        await setCachedTicker(symbol, data)
      } catch (cacheError) {
        console.error("Error caching ticker data:", cacheError)
      }

      return data
    }
  } catch (cryptoCompareError) {
    console.error("Error fetching from CryptoCompare:", cryptoCompareError)
  }

  // 3. Try CoinGecko as another source
  try {
    const geckoData = await fetchFromCoinGecko(symbol)
    if (geckoData) {
      const data = {
        symbol: symbol,
        price: geckoData.current_price.toString(),
        priceChangePercent: geckoData.price_change_percentage_24h.toString(),
        volume: geckoData.total_volume.toString(),
        high: geckoData.high_24h.toString(),
        low: geckoData.low_24h.toString(),
        source: "coingecko",
      }

      // Cache the successful response
      try {
        await setCachedTicker(symbol, data)
      } catch (cacheError) {
        console.error("Error caching ticker data:", cacheError)
      }

      return data
    }
  } catch (geckoError) {
    console.error("Error fetching from CoinGecko:", geckoError)
  }

  // 4. Try Binance as a last resort (since it's failing)
  try {
    // Try the simpler price endpoint first
    const binancePrice = await fetchBinancePrice(symbol)
    if (binancePrice) {
      // Try to get additional data from 24hr ticker
      try {
        const binanceTicker = await fetchBinanceTicker(symbol)
        if (binanceTicker) {
          const data = {
            symbol: symbol,
            price: binanceTicker.lastPrice || binancePrice.price,
            priceChangePercent: binanceTicker.priceChangePercent || "0.00",
            volume: binanceTicker.volume || "0",
            high: binanceTicker.highPrice || "0",
            low: binanceTicker.lowPrice || "0",
            source: "binance-combined",
          }

          // Cache the successful response
          try {
            await setCachedTicker(symbol, data)
          } catch (cacheError) {
            console.error("Error caching ticker data:", cacheError)
          }

          return data
        }
      } catch (tickerError) {
        console.error("Error fetching Binance ticker:", tickerError)
      }

      // Return just the price data if ticker failed
      return {
        symbol: symbol,
        price: binancePrice.price,
        priceChangePercent: "0.00",
        volume: "0",
        high: "0",
        low: "0",
        source: "binance-price",
      }
    }
  } catch (binancePriceError) {
    console.error("Error fetching from Binance price API:", binancePriceError)
  }

  // 5. Use hardcoded current prices as a reliable fallback
  const normalizedSymbol = symbol.toUpperCase()
  if (CURRENT_PRICES[normalizedSymbol]) {
    return {
      symbol: normalizedSymbol,
      ...CURRENT_PRICES[normalizedSymbol],
      source: "hardcoded",
    }
  }

  // 6. Return fallback data if all else fails
  return {
    ...FALLBACK_DATA,
    symbol: symbol,
  }
}

// Fetch just the price from Binance (more reliable endpoint)
async function fetchBinancePrice(symbol: string) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout

    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Binance API returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching from Binance price API:", error)
    return null
  }
}

// Fetch full ticker data from Binance
async function fetchBinanceTicker(symbol: string) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout

    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Binance API returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching from Binance ticker API:", error)
    return null
  }
}

// Fetch from CryptoCompare
async function fetchFromCryptoCompare(symbol: string) {
  try {
    // Extract the coin name from the symbol (e.g., BTCUSDT -> BTC)
    const coin = symbol.replace(/USDT$|USD$/, "")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    const response = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${coin}&tsyms=USD`, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`CryptoCompare API returned ${response.status}`)
    }

    const data = await response.json()
    if (!data.RAW || !data.RAW[coin] || !data.RAW[coin].USD) {
      throw new Error("Invalid response format from CryptoCompare")
    }

    return data.RAW[coin].USD
  } catch (error) {
    console.error("Error fetching from CryptoCompare API:", error)
    return null
  }
}

// Fetch from CoinGecko
async function fetchFromCoinGecko(symbol: string) {
  try {
    // Extract the coin name from the symbol (e.g., BTCUSDT -> bitcoin)
    const coin = symbol.toLowerCase().includes("btc")
      ? "bitcoin"
      : symbol.toLowerCase().includes("eth")
        ? "ethereum"
        : symbol.toLowerCase().includes("sol")
          ? "solana"
          : "bitcoin" // Default to bitcoin

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coin}`, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`CoinGecko API returned ${response.status}`)
    }

    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid response format from CoinGecko")
    }

    return data[0] // Return the first item
  } catch (error) {
    console.error("Error fetching from CoinGecko API:", error)
    return null
  }
}

