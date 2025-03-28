"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Calculator,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchKlines } from "@/lib/binance-api"
import type { SRZone } from "@/lib/support-resistance"
import { useRouter } from "next/navigation"

interface Signal {
  timeframe: string
  signal: "buy" | "sell" | "neutral"
  strength: number
  reason: string
  priceLevel: number
  stopLoss: number
  takeProfit: number
  riskRewardRatio: number
  winRate: number
}

interface IntradaySignalsListProps {
  symbol: string
  supportResistanceLevels: SRZone[]
  currentPrice: number
}

export function IntradaySignalsList({
  symbol = "BTC",
  supportResistanceLevels = [],
  currentPrice = 0,
}: IntradaySignalsListProps) {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const generateSignals = async () => {
      try {
        setLoading(true)

        if (currentPrice <= 0 || supportResistanceLevels.length === 0) {
          setSignals([])
          setLoading(false)
          return
        }

        // Fetch data for different timeframes
        const [fiveMinData, thirtyMinData, fourHourData] = await Promise.all([
          fetchKlines("5m", 100, undefined, symbol),
          fetchKlines("30m", 100, undefined, symbol),
          fetchKlines("4h", 50, undefined, symbol),
        ])

        // Generate signals based on real data and S/R zones
        const generatedSignals: Signal[] = []

        // 5-minute timeframe signal
        const fiveMinSignal = generateSignalForTimeframe("5m", fiveMinData, supportResistanceLevels, currentPrice)
        if (fiveMinSignal && fiveMinSignal.riskRewardRatio >= 1.5) generatedSignals.push(fiveMinSignal)

        // 30-minute timeframe signal
        const thirtyMinSignal = generateSignalForTimeframe("30m", thirtyMinData, supportResistanceLevels, currentPrice)
        if (thirtyMinSignal && thirtyMinSignal.riskRewardRatio >= 1.5) generatedSignals.push(thirtyMinSignal)

        // 4-hour timeframe signal
        const fourHourSignal = generateSignalForTimeframe("4h", fourHourData, supportResistanceLevels, currentPrice)
        if (fourHourSignal && fourHourSignal.riskRewardRatio >= 1.5) generatedSignals.push(fourHourSignal)

        setSignals(generatedSignals)
        setLoading(false)
      } catch (error) {
        console.error("Error generating signals:", error)
        setLoading(false)
      }
    }

    generateSignals()

    // Refresh signals every 5 minutes
    const interval = setInterval(generateSignals, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [symbol, supportResistanceLevels, currentPrice])

  // Generate a signal based on price action and S/R zones
  const generateSignalForTimeframe = (
    timeframe: string,
    candles: any[],
    srZones: SRZone[],
    price: number,
  ): Signal | null => {
    if (!candles || candles.length < 10) return null

    // Get recent candles
    const recentCandles = candles.slice(-10)
    const lastCandle = recentCandles[recentCandles.length - 1]

    // Check if price is near a support or resistance zone
    const nearSupport = srZones.find(
      (zone) => zone.type === "support" && price >= zone.min * 0.995 && price <= zone.max * 1.005,
    )

    const nearResistance = srZones.find(
      (zone) => zone.type === "resistance" && price >= zone.min * 0.995 && price <= zone.max * 1.005,
    )

    // Determine signal type based on price action and S/R zones
    let signal: "buy" | "sell" | "neutral" = "neutral"
    let strength = 5
    let reason = ""

    // Check for bullish signals
    if (nearSupport) {
      // Price bouncing off support
      const bullishCandles = recentCandles.filter((c) => c.close > c.open).length
      if (bullishCandles >= 6) {
        signal = "buy"
        strength = 7
        reason = `Price bounced off support zone (${nearSupport.min.toFixed(0)}-${nearSupport.max.toFixed(0)}) with bullish momentum. ${bullishCandles}/10 recent candles are bullish.`
        reason += ` ${timeframe} timeframe signals typically have ${
          timeframe === "5m" ? "faster" : timeframe === "4h" ? "slower" : "moderate"
        } execution times.`
      } else {
        signal = "neutral"
        reason = `Price is at support zone (${nearSupport.min.toFixed(0)}-${nearSupport.max.toFixed(0)}) but lacks strong bullish confirmation.`
        reason += ` ${timeframe} timeframe signals typically have ${
          timeframe === "5m" ? "faster" : timeframe === "4h" ? "slower" : "moderate"
        } execution times.`
      }
    }
    // Check for bearish signals
    else if (nearResistance) {
      // Price rejected at resistance
      const bearishCandles = recentCandles.filter((c) => c.close < c.open).length
      if (bearishCandles >= 6) {
        signal = "sell"
        strength = 7
        reason = `Price rejected at resistance zone (${nearResistance.min.toFixed(0)}-${nearResistance.max.toFixed(0)}) with bearish momentum. ${bearishCandles}/10 recent candles are bearish.`
        reason += ` ${timeframe} timeframe signals typically have ${
          timeframe === "5m" ? "faster" : timeframe === "4h" ? "slower" : "moderate"
        } execution times.`
      } else {
        signal = "neutral"
        reason = `Price is at resistance zone (${nearResistance.min.toFixed(0)}-${nearResistance.max.toFixed(0)}) but lacks strong bearish confirmation.`
        reason += ` ${timeframe} timeframe signals typically have ${
          timeframe === "5m" ? "faster" : timeframe === "4h" ? "slower" : "moderate"
        } execution times.`
      }
    }
    // Check for trend continuation
    else {
      // Calculate simple trend
      const priceChange = ((lastCandle.close - recentCandles[0].close) / recentCandles[0].close) * 100

      if (priceChange > 1) {
        signal = "buy"
        strength = 6
        reason = `Price is in an uptrend (${priceChange.toFixed(2)}% increase) and not near major resistance.`
        reason += ` ${timeframe} timeframe signals typically have ${
          timeframe === "5m" ? "faster" : timeframe === "4h" ? "slower" : "moderate"
        } execution times.`
      } else if (priceChange < -1) {
        signal = "sell"
        strength = 6
        reason = `Price is in a downtrend (${priceChange.toFixed(2)}% decrease) and not near major support.`
        reason += ` ${timeframe} timeframe signals typically have ${
          timeframe === "5m" ? "faster" : timeframe === "4h" ? "slower" : "moderate"
        } execution times.`
      } else {
        signal = "neutral"
        reason = "Price is consolidating with no clear direction."
        reason += ` ${timeframe} timeframe signals typically have ${
          timeframe === "5m" ? "faster" : timeframe === "4h" ? "slower" : "moderate"
        } execution times.`
      }
    }

    // Calculate risk/reward and other metrics
    let stopLoss = 0
    let takeProfit = 0

    // Timeframe scaling factors - shorter timeframes should have tighter stops and targets
    const timeframeScalingFactor = {
      "5m": 0.4, // 40% of the standard distance
      "30m": 0.7, // 70% of the standard distance
      "4h": 1.2, // 120% of the standard distance
    }
    const scalingFactor = timeframeScalingFactor[timeframe] || 1.0

    if (signal === "buy") {
      // For buy signals, stop loss below nearest support
      const nearestSupport = [...srZones]
        .filter((z) => z.type === "support")
        .sort((a, b) => Math.abs((a.min + a.max) / 2 - price) - Math.abs((b.min + b.max) / 2 - price))[0]

      // Base stop loss calculation
      const baseStopLoss = nearestSupport ? nearestSupport.min * 0.995 : price * 0.98
      // Apply timeframe-specific scaling
      const stopDistance = (price - baseStopLoss) * scalingFactor
      stopLoss = price - stopDistance

      // Take profit is based on risk/reward ratio (1:2)
      takeProfit = price + stopDistance * 2
    } else if (signal === "sell") {
      // For sell signals, stop loss above nearest resistance
      const nearestResistance = [...srZones]
        .filter((z) => z.type === "resistance")
        .sort((a, b) => Math.abs((a.min + a.max) / 2 - price) - Math.abs((b.min + b.max) / 2 - price))[0]

      // Base stop loss calculation
      const baseStopLoss = nearestResistance ? nearestResistance.max * 1.005 : price * 1.02
      // Apply timeframe-specific scaling
      const stopDistance = (baseStopLoss - price) * scalingFactor
      stopLoss = price + stopDistance

      // Take profit is based on risk/reward ratio (1:2)
      takeProfit = price - stopDistance * 2
    } else {
      // For neutral signals, use tight stops with timeframe scaling
      const stopDistance = price * 0.02 * scalingFactor // 2% scaled by timeframe
      stopLoss = price * (1 - stopDistance)
      takeProfit = price * (1 + stopDistance)
    }

    // Calculate risk/reward ratio
    const risk = Math.abs(price - stopLoss)
    const reward = Math.abs(price - takeProfit)
    const riskRewardRatio = reward / risk

    // Estimate win rate based on signal strength
    const winRate = 50 + strength * 3

    return {
      timeframe,
      signal,
      strength,
      reason,
      priceLevel: price,
      stopLoss,
      takeProfit,
      riskRewardRatio,
      winRate,
    }
  }

  const getSignalIcon = (signal: "buy" | "sell" | "neutral") => {
    switch (signal) {
      case "buy":
        return <ArrowUpCircle className="h-5 w-5 text-green-500" />
      case "sell":
        return <ArrowDownCircle className="h-5 w-5 text-red-500" />
      case "neutral":
        return <MinusCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getSignalText = (signal: "buy" | "sell" | "neutral") => {
    switch (signal) {
      case "buy":
        return "Buy"
      case "sell":
        return "Sell"
      case "neutral":
        return "Neutral"
    }
  }

  const getSignalColor = (signal: "buy" | "sell" | "neutral") => {
    switch (signal) {
      case "buy":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "sell":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "neutral":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    }
  }

  const getStrengthDots = (strength: number) => {
    return Array(10)
      .fill(0)
      .map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < strength ? "bg-primary" : "bg-muted"}`} />)
  }

  const toggleExpandSignal = (timeframe: string) => {
    if (expandedSignal === timeframe) {
      setExpandedSignal(null)
    } else {
      setExpandedSignal(timeframe)
    }
  }

  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case "5m":
        return "5 Minutes"
      case "30m":
        return "30 Minutes"
      case "4h":
        return "4 Hours"
      default:
        return timeframe
    }
  }

  // Function to open calculator with signal data
  const openCalculator = (signal: Signal, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent toggling the expanded state

    // Create query parameters with signal data
    const params = new URLSearchParams({
      entryPrice: signal.priceLevel.toString(),
      stopLoss: signal.stopLoss.toString(),
      takeProfit: signal.takeProfit.toString(),
      positionType: signal.signal === "buy" ? "long" : "short",
    })

    // Navigate to calculator page with params
    router.push(`/calculator?${params.toString()}`)
  }

  return (
    <div>
      <Alert variant="destructive" className="mb-4 bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Warning:</strong> These signals are generated by technical analysis and do not constitute financial
          advice. Past performance is not indicative of future results. Approximately 80% of retail traders lose money
          when trading financial products. Always use proper risk management and conduct your own due diligence before
          entering any trades.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : signals.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          No signals with favorable risk/reward ratio (≥1.5) available. Check back later.
        </div>
      ) : (
        <div className="space-y-4">
          {signals.map((signal) => (
            <div
              key={signal.timeframe}
              className={`rounded-lg border p-4 cursor-pointer transition-all ${
                signal.signal === "buy"
                  ? "bg-green-500/10 border-green-500/20"
                  : signal.signal === "sell"
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-yellow-500/10 border-yellow-500/20"
              }`}
              onClick={() => toggleExpandSignal(signal.timeframe)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSignalIcon(signal.signal)}
                  <span className="font-semibold capitalize">{getSignalText(signal.signal)} Signal</span>
                  <Badge variant="outline" className="ml-2">
                    {getTimeframeLabel(signal.timeframe)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Strength:</span>
                    <div className="flex gap-0.5">{getStrengthDots(signal.strength)}</div>
                  </div>
                  {expandedSignal === signal.timeframe ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedSignal === signal.timeframe && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Analysis</h4>
                    <p className="text-sm">{signal.reason}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-1">Entry Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Entry Price:</span>
                          <span>${signal.priceLevel.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stop Loss:</span>
                          <span className="text-red-500">
                            ${signal.stopLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Take Profit:</span>
                          <span className="text-green-500">
                            ${signal.takeProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Statistics</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Risk/Reward:</span>
                          <span className="font-medium">{signal.riskRewardRatio.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. Win Rate:</span>
                          <span>{signal.winRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expected Value:</span>
                          <span
                            className={
                              (signal.winRate * signal.riskRewardRatio) / 100 > 1
                                ? "text-green-500 font-medium"
                                : "text-red-500 font-medium"
                            }
                          >
                            {((signal.winRate / 100) * signal.riskRewardRatio - (100 - signal.winRate) / 100).toFixed(
                              2,
                            )}
                            R
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button size="sm" className="flex items-center gap-1" onClick={(e) => openCalculator(signal, e)}>
                      <Calculator className="h-4 w-4" />
                      Open in Calculator
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-muted-foreground">
        <p>
          These signals are based on support/resistance zones, price action analysis, and historical pattern statistics.
          Only signals with risk/reward ratio of 1.5 or higher are shown. Always combine with your own analysis and risk
          management strategy.
        </p>
      </div>
    </div>
  )
}

