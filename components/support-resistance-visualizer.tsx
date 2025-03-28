"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowUp, ArrowDown, RefreshCw, Clock } from "lucide-react"
import { fetchKlines, type CandleData } from "@/lib/binance-api"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface Level {
  price: number
  strength: number
  type: "support" | "resistance"
  volume: number
}

export function SupportResistanceVisualizer() {
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [nextRefresh, setNextRefresh] = useState<Date>(new Date(Date.now() + 5 * 60 * 1000))
  const { toast } = useToast()

  // Function to fetch and calculate support/resistance levels
  const fetchSupportResistance = useCallback(async () => {
    setLoading(true)
    try {
      // Force cache bypass by adding a timestamp to the request
      const timestamp = new Date().getTime()

      // Get multiple timeframe data for better analysis
      const data4h = await fetchKlines("4h", 42, timestamp) // 7 days of 4h data
      const data1h = await fetchKlines("1h", 48, timestamp) // 2 days of 1h data
      const data30m = await fetchKlines("30m", 48, timestamp) // 1 day of 30m data

      // Calculate support and resistance levels using volume profile
      const supportResistanceLevels = calculateVolumeBasedSupportResistance(data4h, data1h, data30m)
      setLevels(supportResistanceLevels)
      setLastUpdated(new Date())
      setNextRefresh(new Date(Date.now() + 5 * 60 * 1000))
    } catch (error) {
      console.error("Error fetching support/resistance data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch support and resistance levels",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  // Initial data fetch
  useEffect(() => {
    fetchSupportResistance()

    // Update every 5 minutes
    const interval = setInterval(
      () => {
        fetchSupportResistance()
      },
      5 * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [fetchSupportResistance])

  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      if (now >= nextRefresh) {
        setNextRefresh(new Date(now.getTime() + 5 * 60 * 1000))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [nextRefresh])

  const calculateVolumeBasedSupportResistance = (
    data4h: CandleData[],
    data1h: CandleData[],
    data30m: CandleData[],
  ): Level[] => {
    // If no data, return empty array
    if (!data4h.length || !data1h.length || !data30m.length) {
      return []
    }

    // Get the current price
    const currentPrice = data30m[data30m.length - 1].close

    // Create price bins for volume profile
    const priceBins: Record<string, { volume: number; touches: number; type: "support" | "resistance" | null }> = {}
    const binSize = currentPrice * 0.005 // 0.5% bins

    // Process 4h data (longer-term levels)
    data4h.forEach((candle) => {
      // Round prices to nearest bin
      const highBin = Math.round(candle.high / binSize) * binSize
      const lowBin = Math.round(candle.low / binSize) * binSize

      // Add volume to bins
      for (let price = lowBin; price <= highBin; price += binSize) {
        const binKey = price.toFixed(0)
        if (!priceBins[binKey]) {
          priceBins[binKey] = { volume: 0, touches: 0, type: null }
        }

        // Add more volume weight to 4h candles
        priceBins[binKey].volume += candle.volume * 0.4

        // Check if this price level was tested (touched)
        if (Math.abs(candle.high - price) < binSize || Math.abs(candle.low - price) < binSize) {
          priceBins[binKey].touches += 1
        }
      }
    })

    // Process 1h data (medium-term levels)
    data1h.forEach((candle) => {
      const highBin = Math.round(candle.high / binSize) * binSize
      const lowBin = Math.round(candle.low / binSize) * binSize

      for (let price = lowBin; price <= highBin; price += binSize) {
        const binKey = price.toFixed(0)
        if (!priceBins[binKey]) {
          priceBins[binKey] = { volume: 0, touches: 0, type: null }
        }

        // Add medium volume weight to 1h candles
        priceBins[binKey].volume += candle.volume * 0.3

        if (Math.abs(candle.high - price) < binSize || Math.abs(candle.low - price) < binSize) {
          priceBins[binKey].touches += 1
        }
      }
    })

    // Process 30m data (short-term levels)
    data30m.forEach((candle) => {
      const highBin = Math.round(candle.high / binSize) * binSize
      const lowBin = Math.round(candle.low / binSize) * binSize

      for (let price = lowBin; price <= highBin; price += binSize) {
        const binKey = price.toFixed(0)
        if (!priceBins[binKey]) {
          priceBins[binKey] = { volume: 0, touches: 0, type: null }
        }

        // Add less volume weight to 30m candles
        priceBins[binKey].volume += candle.volume * 0.3

        if (Math.abs(candle.high - price) < binSize || Math.abs(candle.low - price) < binSize) {
          priceBins[binKey].touches += 1
        }
      }
    })

    // Determine support and resistance levels
    Object.keys(priceBins).forEach((binKey) => {
      const price = Number.parseFloat(binKey)
      if (price < currentPrice) {
        priceBins[binKey].type = "support"
      } else {
        priceBins[binKey].type = "resistance"
      }
    })

    // Convert to array and sort by volume
    const volumeLevels = Object.entries(priceBins)
      .map(([price, data]) => ({
        price: Number.parseFloat(price),
        volume: data.volume,
        touches: data.touches,
        type: data.type as "support" | "resistance",
      }))
      .sort((a, b) => b.volume - a.volume)

    // Get top levels (3 support, 3 resistance)
    const topSupport = volumeLevels
      .filter((level) => level.type === "support" && Math.abs(level.price - currentPrice) / currentPrice < 0.05)
      .slice(0, 3)

    const topResistance = volumeLevels
      .filter((level) => level.type === "resistance" && Math.abs(level.price - currentPrice) / currentPrice < 0.05)
      .slice(0, 3)

    // Calculate strength based on volume and touches
    const maxVolume = Math.max(...volumeLevels.map((level) => level.volume))

    const calculateStrength = (level: { volume: number; touches: number }) => {
      // Base strength on volume (70%) and number of touches (30%)
      const volumeStrength = (level.volume / maxVolume) * 70
      const touchStrength = Math.min(level.touches * 5, 30) // Cap at 30%
      return Math.round(volumeStrength + touchStrength)
    }

    // Create final levels
    const finalLevels: Level[] = [
      ...topSupport.map((level) => ({
        price: level.price,
        strength: calculateStrength(level),
        type: "support" as const,
        volume: level.volume,
      })),
      ...topResistance.map((level) => ({
        price: level.price,
        strength: calculateStrength(level),
        type: "resistance" as const,
        volume: level.volume,
      })),
    ]

    // Sort by price (descending)
    return finalLevels.sort((a, b) => b.price - a.price)
  }

  // Manual refresh handler
  const handleRefresh = () => {
    setRefreshing(true)
    fetchSupportResistance()
  }

  // Format time
  const formatTime = (date: Date) => {
    return format(date, "HH:mm:ss")
  }

  // Calculate time until next refresh
  const getTimeUntilNextRefresh = () => {
    const now = new Date()
    const diff = nextRefresh.getTime() - now.getTime()
    if (diff <= 0) return "00:00"

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Last updated: {formatTime(lastUpdated)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">Next: {getTimeUntilNextRefresh()}</div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-7 px-2" disabled={refreshing}>
            {refreshing ? (
              <>
                <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="text-xs">Updating...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                <span className="text-xs">Refresh</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {levels.length === 0 ? (
        <div className="text-center text-muted-foreground py-4">No significant levels detected in current range</div>
      ) : (
        levels.map((level, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {level.type === "resistance" ? (
                <ArrowUp className="h-4 w-4 text-red-500" />
              ) : (
                <ArrowDown className="h-4 w-4 text-green-500" />
              )}
              <span className={level.type === "resistance" ? "text-red-500" : "text-green-500"}>
                ${level.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-2 rounded-full ${level.type === "resistance" ? "bg-red-500" : "bg-green-500"}`}
                  style={{ width: `${level.strength}%` }}
                />
              </div>
              <span className="text-xs">{level.strength}%</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

