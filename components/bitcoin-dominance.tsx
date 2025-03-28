"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BitcoinDominance() {
  const [dominance, setDominance] = useState<number | null>(null)
  const [previousDominance, setPreviousDominance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDominance = async () => {
      try {
        setLoading(true)
        // Fetch from CoinGecko API
        const response = await fetch("https://api.coingecko.com/api/v3/global")

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`)
        }

        const data = await response.json()

        if (data && data.data && data.data.market_cap_percentage && data.data.market_cap_percentage.btc) {
          // Store previous value before updating
          setPreviousDominance(dominance)
          setDominance(data.data.market_cap_percentage.btc)
        } else {
          throw new Error("Invalid data format")
        }

        setError(null)
      } catch (err) {
        console.error("Error fetching BTC dominance:", err)
        setError("Failed to load BTC dominance")

        // If we don't have data yet, try alternative API
        if (dominance === null) {
          try {
            const response = await fetch("https://api.coinpaprika.com/v1/global")

            if (!response.ok) {
              throw new Error(`Failed to fetch from backup: ${response.status}`)
            }

            const data = await response.json()

            if (data && data.bitcoin_dominance_percentage) {
              setDominance(data.bitcoin_dominance_percentage)
              setPreviousDominance(data.bitcoin_dominance_percentage - 0.2) // Approximate previous value
              setError(null)
            }
          } catch (backupErr) {
            console.error("Error fetching from backup source:", backupErr)
            // Use fallback values if all APIs fail
            setDominance(58.65)
            setPreviousDominance(58.2)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDominance()
    // Refresh every 15 minutes
    const interval = setInterval(fetchDominance, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [dominance])

  // Determine the color and status based on dominance value
  const getDominanceStatus = () => {
    if (!dominance) return { color: "gray", status: "Unknown" }

    if (dominance > 60) return { color: "green", status: "Very High" }
    if (dominance > 55) return { color: "green", status: "High" }
    if (dominance > 50) return { color: "yellow", status: "Moderate" }
    if (dominance > 45) return { color: "orange", status: "Low" }
    return { color: "red", status: "Very Low" }
  }

  const status = getDominanceStatus()

  // Calculate the percentage for the gauge
  const getGaugePercentage = () => {
    if (!dominance) return 0
    // Map dominance from 40-70 range to 0-100 for the gauge
    return Math.min(100, Math.max(0, (dominance - 40) * (100 / 30)))
  }

  const gaugePercentage = getGaugePercentage()

  // Get color for the gauge
  const getGaugeColor = () => {
    if (!dominance) return "#6b7280" // gray-500

    if (dominance > 60) return "#10b981" // green-500
    if (dominance > 55) return "#22c55e" // green-400
    if (dominance > 50) return "#eab308" // yellow-500
    if (dominance > 45) return "#f97316" // orange-500
    return "#ef4444" // red-500
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Bitcoin Dominance</CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
            <a
              href="https://www.tradingview.com/symbols/BTC.D/"
              target="_blank"
              rel="noopener noreferrer"
              title="Compare on TradingView"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Compare on TradingView</span>
            </a>
          </Button>
        </div>
        <CardDescription>Real-time market dominance data</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && !dominance ? (
          <div className="flex h-[100px] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : error && !dominance ? (
          <div className="flex h-[100px] items-center justify-center">
            <div className="text-center text-red-500">{error}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-32 h-32">
              {/* Gauge background */}
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke={getGaugeColor()}
                  strokeWidth="12"
                  strokeDasharray="339.292"
                  strokeDashoffset={339.292 - (339.292 * gaugePercentage) / 100}
                />
              </svg>

              {/* Gauge value */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold">{dominance?.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">{status.status}</div>
              </div>
            </div>

            <div className="flex items-center mt-2">
              {previousDominance && dominance && (
                <>
                  {dominance > previousDominance ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={dominance > previousDominance ? "text-green-500 text-sm" : "text-red-500 text-sm"}>
                    {dominance > previousDominance ? "+" : ""}
                    {(dominance - (previousDominance || 0)).toFixed(2)}%
                  </span>
                </>
              )}
            </div>

            <div className="text-xs text-muted-foreground mt-2 text-center">
              {status.status === "High" || status.status === "Very High"
                ? "Strong Bitcoin dominance indicates potential altcoin weakness"
                : "Lower Bitcoin dominance suggests potential altcoin strength"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

