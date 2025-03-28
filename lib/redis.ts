import { Redis } from "@upstash/redis"

// Create a mock Redis client for when Redis is not available
const createMockRedisClient = () => {
  const cache = new Map<string, any>()

  return {
    get: async (key: string) => {
      console.log(`[Mock Redis] Getting key: ${key}`)
      return cache.get(key) || null
    },
    set: async (key: string, value: any, options?: { ex?: number }) => {
      console.log(`[Mock Redis] Setting key: ${key}`)
      cache.set(key, value)

      // Handle expiration if needed
      if (options?.ex) {
        setTimeout(() => {
          cache.delete(key)
        }, options.ex * 1000)
      }

      return "OK"
    },
    del: async (key: string) => {
      console.log(`[Mock Redis] Deleting key: ${key}`)
      return cache.delete(key) ? 1 : 0
    },
    exists: async (key: string) => {
      return cache.has(key) ? 1 : 0
    },
  }
}

// Initialize Redis client
let redis: any

try {
  // Check if we have the REST API URL and token
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
    console.log("Redis client initialized with REST API")
  }
  // Check if we have the Redis URL
  else if (process.env.REDIS_URL || process.env.KV_URL) {
    // For standard Redis URL, we need to parse it and extract the password
    const url = process.env.REDIS_URL || process.env.KV_URL

    // Create a URL object to parse the Redis URL
    const parsedUrl = new URL(url!)

    // Extract the password from the URL
    const password = parsedUrl.password

    // Extract the host and port
    const host = parsedUrl.hostname
    const port = parsedUrl.port || "6379"

    // Create the Redis client with the parsed values
    redis = new Redis({
      url: `https://${host}:${port}`,
      token: password,
    })
    console.log("Redis client initialized with standard URL")
  } else {
    console.warn("No Redis credentials found, using mock Redis client")
    redis = createMockRedisClient()
  }
} catch (error) {
  console.error("Failed to initialize Redis client:", error)
  console.warn("Using mock Redis client as fallback")
  redis = createMockRedisClient()
}

// Helper functions for working with Redis
export const getRedisClient = () => redis

// Function to check if data needs to be refreshed
export async function needsRefresh(
  type: string,
  maxAgeSeconds: number,
  params: Record<string, any> = {},
): Promise<boolean> {
  try {
    const key = `${type}:lastUpdated:${JSON.stringify(params)}`
    const lastUpdated = await redis.get(key)

    if (!lastUpdated) {
      return true
    }

    const now = Date.now()
    const age = now - Number(lastUpdated)

    return age > maxAgeSeconds * 1000
  } catch (error) {
    console.error("Error checking if data needs refresh:", error)
    return true // Refresh by default if there's an error
  }
}

// Function to mark data as refreshed
export async function markRefreshed(type: string, params: Record<string, any> = {}): Promise<void> {
  try {
    const key = `${type}:lastUpdated:${JSON.stringify(params)}`
    await redis.set(key, Date.now().toString())
  } catch (error) {
    console.error("Error marking data as refreshed:", error)
  }
}

// Function to get cached ticker data
export async function getCachedTicker(symbol: string): Promise<any> {
  try {
    const key = `ticker:${symbol}`
    const data = await redis.get(key)
    // Return null if no data
    if (!data) return null
    // If data is already an object, return it
    if (typeof data === "object" && data !== null) return data
    // Otherwise try to parse it
    try {
      return JSON.parse(data)
    } catch (e) {
      console.error("Error parsing cached ticker data:", e)
      return null
    }
  } catch (error) {
    console.error("Error getting cached ticker:", error)
    return null
  }
}

// Function to set cached ticker data
export async function setCachedTicker(symbol: string, data: any): Promise<void> {
  try {
    const key = `ticker:${symbol}`
    // Ensure data is serialized as JSON string
    const serializedData = typeof data === "string" ? data : JSON.stringify(data)
    await redis.set(key, serializedData, { ex: 60 }) // Cache for 60 seconds
    await markRefreshed("ticker", { symbol })
  } catch (error) {
    console.error("Error setting cached ticker:", error)
  }
}

// Function to get cached candle data
export async function getCachedCandles(symbol: string, interval: string, limit: number): Promise<any> {
  try {
    const key = `candles:${symbol}:${interval}:${limit}`
    const data = await redis.get(key)
    // Return null if no data
    if (!data) return null
    // If data is already an object, return it
    if (typeof data === "object" && data !== null) return data
    // Otherwise try to parse it
    try {
      return JSON.parse(data)
    } catch (e) {
      console.error("Error parsing cached candle data:", e)
      return null
    }
  } catch (error) {
    console.error("Error getting cached candles:", error)
    return null
  }
}

// Function to set cached candle data
export async function setCachedCandles(symbol: string, interval: string, limit: number, data: any): Promise<void> {
  try {
    const key = `candles:${symbol}:${interval}:${limit}`
    // Ensure data is serialized as JSON string
    const serializedData = typeof data === "string" ? data : JSON.stringify(data)

    // Cache duration depends on the interval
    let cacheDuration = 60 // Default 60 seconds

    if (interval === "1h") {
      cacheDuration = 5 * 60 // 5 minutes
    } else if (interval === "4h") {
      cacheDuration = 15 * 60 // 15 minutes
    } else if (interval === "1d") {
      cacheDuration = 60 * 60 // 1 hour
    }

    await redis.set(key, serializedData, { ex: cacheDuration })
    await markRefreshed("candles", { symbol, interval, limit })
  } catch (error) {
    console.error("Error setting cached candles:", error)
  }
}

// Function to get cached support/resistance levels
export async function getCachedSupportResistanceLevels(symbol: string): Promise<any> {
  try {
    const key = `levels:${symbol}`
    const data = await redis.get(key)
    // Return null if no data
    if (!data) return null
    // If data is already an object, return it
    if (typeof data === "object" && data !== null) return data
    // Otherwise try to parse it
    try {
      return JSON.parse(data)
    } catch (e) {
      console.error("Error parsing cached levels data:", e)
      return null
    }
  } catch (error) {
    console.error("Error getting cached levels:", error)
    return null
  }
}

// Function to set cached support/resistance levels
export async function setCachedSupportResistanceLevels(symbol: string, data: any): Promise<void> {
  try {
    const key = `levels:${symbol}`
    // Ensure data is serialized as JSON string
    const serializedData = typeof data === "string" ? data : JSON.stringify(data)
    await redis.set(key, serializedData, { ex: 60 * 60 }) // Cache for 1 hour
    await markRefreshed("levels", { symbol })
  } catch (error) {
    console.error("Error setting cached levels:", error)
  }
}

