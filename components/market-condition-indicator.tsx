"use client"

import { useState, useEffect } from "react"
import { Gauge, TrendingUp, TrendingDown, Activity } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { fetchKlines, type CandleData } from "@/lib/binance-api"

interface MarketConditionIndicatorProps {
  symbol?: string
}

export function MarketConditionIndicator({ symbol = "BTC" }: MarketConditionIndicatorProps) {
  const [trend, setTrend] = useState<"bullish" | "bearish" | "neutral">("neutral")
  const [volatility, setVolatility] = useState(0)
  const [momentum, setMomentum] = useState(0)
  const [volume, setVolume] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    // Fetch data for analysis
    const fetchData = async () => {
      try {
        // Get 1h data for the last 24 hours
        const hourlyData = await fetchKlines("1h", 24, undefined, symbol)

        // Get 30m data for the last 12 hours
        const thirtyMinData = await fetchKlines("30m", 24, undefined, symbol)

        if (!isMounted) return

        // Calculate market conditions
        calculateMarketConditions(hourlyData, thirtyMinData)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching market condition data:", error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    // Update every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [symbol])

  const calculateMarketConditions = (hourlyData: CandleData[], thirtyMinData: CandleData[]) => {
    // Calculate trend
    const recentPrices = hourlyData.slice(-6).map((c) => c.close)
    const oldPrices = hourlyData.slice(-12, -6).map((c) => c.close)

    const recentAvg = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length
    const oldAvg = oldPrices.reduce((sum, price) => sum + price, 0) / oldPrices.length

    const trendStrength = ((recentAvg - oldAvg) / oldAvg) * 100

    if (trendStrength > 0.5) {
      setTrend("bullish")
    } else if (trendStrength < -0.5) {
      setTrend("bearish")
    } else {
      setTrend("neutral")
    }

    // Calculate volatility
    const returns = []
    for (let i = 1; i < hourlyData.length; i++) {
      const returnPct = ((hourlyData[i].close - hourlyData[i - 1].close) / hourlyData[i - 1].close) * 100
      returns.push(Math.abs(returnPct))
    }

    const avgVolatility = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const normalizedVolatility = Math.min(Math.round(avgVolatility * 20), 100)
    setVolatility(normalizedVolatility)

    // Calculate momentum
    const rsiValue = calculateRSI(
      hourlyData.map((c) => c.close),
      14,
    )
    const normalizedMomentum = Math.round(rsiValue)
    setMomentum(normalizedMomentum)

    // Calculate volume
    const recentVolumes = thirtyMinData.slice(-12).map((c) => c.volume)
    const oldVolumes = thirtyMinData.slice(-24, -12).map((c) => c.volume)

    const recentAvgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length
    const oldAvgVolume = oldVolumes.reduce((sum, vol) => sum + vol, 0) / oldVolumes.length

    const volumeChange = ((recentAvgVolume - oldAvgVolume) / oldAvgVolume) * 100
    const normalizedVolume = Math.min(Math.max(Math.round(50 + volumeChange), 0), 100)
    setVolume(normalizedVolume)
  }

  const calculateRSI = (prices: number[], period: number): number => {
    if (prices.length < period + 1) {
      return 50 // Default to neutral if not enough data
    }

    const changes = []
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1])
    }

    let gains = 0
    let losses = 0

    // Calculate initial average gain and loss
    for (let i = 0; i < period; i++) {
      if (changes[i] >= 0) {
        gains += changes[i]
      } else {
        losses += Math.abs(changes[i])
      }
    }

    let avgGain = gains / period
    let avgLoss = losses / period

    // Calculate subsequent average gain and loss values
    for (let i = period; i < changes.length; i++) {
      if (changes[i] >= 0) {
        avgGain = (avgGain * (period - 1) + changes[i]) / period
        avgLoss = (avgLoss * (period - 1)) / period
      } else {
        avgGain = (avgGain * (period - 1)) / period
        avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period
      }
    }

    if (avgLoss === 0) {
      return 100
    }

    const rs = avgGain / avgLoss
    const rsi = 100 - 100 / (1 + rs)

    return rsi
  }

  const getTrendIcon = () => {
    switch (trend) {
      case "bullish":
        return <TrendingUp className="h-5 w-5 text-green-500" />
      case "bearish":
        return <TrendingDown className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-yellow-500" />
    }
  }

  const getTrendText = () => {
    switch (trend) {
      case "bullish":
        return "Bullish"
      case "bearish":
        return "Bearish"
      default:
        return "Neutral"
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case "bullish":
        return "text-green-500"
      case "bearish":
        return "text-red-500"
      default:
        return "text-yellow-500"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`font-medium ${getTrendColor()}`}>{getTrendText()}</span>
        </div>
        <Gauge className="h-5 w-5" />
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>Volatility</span>
            <span className={volatility > 60 ? "text-yellow-500" : "text-green-500"}>{volatility}%</span>
          </div>
          <Progress value={volatility} className="h-2" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>Momentum</span>
            <span className={momentum > 70 ? "text-green-500" : momentum < 30 ? "text-red-500" : "text-yellow-500"}>
              {momentum}%
            </span>
          </div>
          <Progress value={momentum} className="h-2" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>Volume</span>
            <span className={volume > 70 ? "text-green-500" : "text-muted-foreground"}>{volume}%</span>
          </div>
          <Progress value={volume} className="h-2" />
        </div>
      </div>
    </div>
  )
}

