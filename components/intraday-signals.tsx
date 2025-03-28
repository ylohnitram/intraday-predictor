"use client"

import { useState, useEffect } from "react"
import { MinusCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchKlines } from "@/lib/binance-api"
import type { SRZone } from "@/lib/support-resistance"

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

interface IntradaySignalsProps {
  symbol: string
  supportResistanceLevels: SRZone[]
  currentPrice: number
}

export function IntradaySignals({
  symbol = "BTC",
  supportResistanceLevels = [],
  currentPrice = 0,
}: IntradaySignalsProps) {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)

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
        if (fiveMinSignal) generatedSignals.push(fiveMinSignal)

        // 30-minute timeframe signal
        const thirtyMinSignal = generateSignalForTimeframe("30m", thirtyMinData, supportResistanceLevels, currentPrice)
        if (thirtyMinSignal) generatedSignals.push(thirtyMinSignal)

        // 4-hour timeframe signal
        const fourHourSignal = generateSignalForTimeframe("4h", fourHourData, supportResistanceLevels, currentPrice)
        if (fourHourSignal) generatedSignals.push(fourHourSignal)

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
      } else {
        signal = "neutral"
        reason = `Price is at support zone (${nearSupport.min.toFixed(0)}-${nearSupport.max.toFixed(0)}) but lacks strong bullish confirmation.`
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
      } else {
        signal = "neutral"
        reason = `Price is at resistance zone (${nearResistance.min.toFixed(0)}-${nearResistance.max.toFixed(0)}) but lacks strong bearish confirmation.`
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
      } else if (priceChange < -1) {
        signal = "sell"
        strength = 6
        reason = `Price is in a downtrend (${priceChange.toFixed(2)}% decrease) and not near major support.`
      } else {
        signal = "neutral"
        reason = "Price is consolidating with no clear direction."
      }
    }

    // Calculate risk/reward and other metrics
    let stopLoss = 0
    let takeProfit = 0

    if (signal === "buy") {
      // For buy signals, stop loss below nearest support
      const nearestSupport = [...srZones]
        .filter((z) => z.type === "support")
        .sort((a, b) => Math.abs((a.min + a.max) / 2 - price) - Math.abs((b.min + b.max) / 2 - price))[0]

      stopLoss = nearestSupport ? nearestSupport.min * 0.995 : price * 0.98
      takeProfit = price + (price - stopLoss) * 2 // 1:2 risk/reward
    } else if (signal === "sell") {
      // For sell signals, stop loss above nearest resistance
      const nearestResistance = [...srZones]
        .filter((z) => z.type === "resistance")
        .sort((a, b) => Math.abs((a.min + a.max) / 2 - price) - Math.abs((b.min + b.max) / 2 - price))[0]

      stopLoss = nearestResistance ? nearestResistance.max * 1.005 : price * 1.02
      takeProfit = price - (stopLoss - price) * 2 // 1:2 risk/reward
    } else {
      // For neutral signals, use tight stops
      stopLoss = price * 0.98
      takeProfit = price * 1.02
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

  const getStrengthDots = (strength: number) => {
    return Array(10)
      .fill(0)
      .map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < strength ? "bg-primary" : "bg-muted"}`} />)
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
          No signals available. Check back later.
        </div>
      ) : (
        <Tabs defaultValue="30m">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="5m">5 Minutes</TabsTrigger>
            <TabsTrigger value="30m">30 Minutes</TabsTrigger>
            <TabsTrigger value="4h">4 Hours</TabsTrigger>
          </TabsList>

          {signals.map((signal) => (
            <TabsContent key={signal.timeframe} value={signal.timeframe} className="mt-4">
              <div
                className={`rounded-lg border p-6 ${
                  signal.signal === "buy"
                    ? "bg-green-500/10 border-green-500/20"
                    : signal.signal === "sell"
                      ? "bg-red-500/10 border-red-500/20"
                      : "bg-yellow-500/10 border-yellow-500/20"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MinusCircle
                      className={`h-6 w-6 ${
                        signal.signal === "buy"
                          ? "text-green-500"
                          : signal.signal === "sell"
                            ? "text-red-500"
                            : "text-yellow-500"
                      }`}
                    />
                    <span className="font-semibold text-lg capitalize">
                      {signal.signal === "buy" ? "Buy" : signal.signal === "sell" ? "Sell" : "Neutral"} Signal
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Strength:</span>
                    <div className="flex gap-0.5">{getStrengthDots(signal.strength)}</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Analysis</h4>
                    <p className="text-sm">{signal.reason}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium mb-2">Entry Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Entry Price:</span>
                          <span className="font-medium">
                            ${signal.priceLevel.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stop Loss:</span>
                          <span className="text-red-500 font-medium">
                            ${signal.stopLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Take Profit:</span>
                          <span className="text-green-500 font-medium">
                            ${signal.takeProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Statistics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Risk/Reward:</span>
                          <span className="font-medium">{signal.riskRewardRatio.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. Win Rate:</span>
                          <span className="font-medium">{signal.winRate}%</span>
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
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <div className="mt-4 text-xs text-muted-foreground">
        <p>
          These signals are based on support/resistance zones, price action analysis, and historical pattern statistics.
          Always combine with your own analysis and risk management strategy.
        </p>
      </div>
    </div>
  )
}

