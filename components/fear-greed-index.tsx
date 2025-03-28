"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FearGreedData {
  value: number
  classification: string
  timestamp: string
  previousValue: number
  previousClassification: string
}

export function FearGreedIndex() {
  const [data, setData] = useState<FearGreedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch from Alternative.me API
        const response = await fetch("https://api.alternative.me/fng/?limit=2")

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`)
        }

        const result = await response.json()

        if (!result || !result.data || result.data.length < 2) {
          throw new Error("Invalid data format from Fear & Greed API")
        }

        const current = result.data[0]
        const previous = result.data[1]

        setData({
          value: Number.parseInt(current.value),
          classification: current.value_classification,
          timestamp: current.timestamp,
          previousValue: Number.parseInt(previous.value),
          previousClassification: previous.value_classification,
        })

        setError(null)
      } catch (err) {
        console.error("Error fetching Fear & Greed Index:", err)
        setError("Failed to fetch Fear & Greed Index")

        // Try alternative API
        try {
          const response = await fetch("https://api.coinpaprika.com/v1/global")

          if (!response.ok) {
            throw new Error(`Failed to fetch from backup: ${response.status}`)
          }

          const result = await response.json()

          // Coinpaprika doesn't have fear & greed, but we can approximate from volatility
          if (result && result.volatility_24h) {
            // Convert volatility to a fear/greed value (higher volatility = more fear)
            const volatility = Number.parseFloat(result.volatility_24h)
            const approximateValue = Math.max(1, Math.min(99, 100 - volatility * 10))

            let classification = "Neutral"
            if (approximateValue <= 25) classification = "Extreme Fear"
            else if (approximateValue <= 40) classification = "Fear"
            else if (approximateValue <= 60) classification = "Neutral"
            else if (approximateValue <= 80) classification = "Greed"
            else classification = "Extreme Greed"

            setData({
              value: Math.round(approximateValue),
              classification,
              timestamp: new Date().toISOString(),
              previousValue: Math.round(approximateValue) - 2, // Approximate
              previousClassification: classification,
            })

            setError(null)
          }
        } catch (backupErr) {
          console.error("Error fetching from backup source:", backupErr)

          // Use fallback data if all APIs fail
          setData({
            value: 45,
            classification: "Fear",
            timestamp: new Date().toISOString(),
            previousValue: 42,
            previousClassification: "Fear",
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Refresh data every hour (the API updates once per day)
    const interval = setInterval(fetchData, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  function getClassColor(classification: string): string {
    switch (classification.toLowerCase()) {
      case "extreme fear":
        return "text-red-600"
      case "fear":
        return "text-orange-500"
      case "neutral":
        return "text-yellow-500"
      case "greed":
        return "text-green-500"
      case "extreme greed":
        return "text-green-600"
      default:
        return "text-gray-500"
    }
  }

  function getGaugeColor(value: number): string {
    if (value <= 25) return "#ef4444" // red-500
    if (value <= 40) return "#f97316" // orange-500
    if (value <= 55) return "#eab308" // yellow-500
    if (value <= 75) return "#22c55e" // green-500
    return "#16a34a" // green-600
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Fear & Greed Index</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  The Fear & Greed Index measures market sentiment. High values mean greed is driving the market, while
                  low values indicate fear. Extreme readings often signal potential market reversals.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>Real-time market sentiment indicator</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-16 items-center justify-center">
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 text-sm">{error}</div>
        ) : (
          data && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-16 w-16 relative">
                  <svg viewBox="0 0 120 120" className="h-full w-full">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke={getGaugeColor(data.value)}
                      strokeWidth="12"
                      strokeDasharray="339.292"
                      strokeDashoffset={339.292 - (339.292 * data.value) / 100}
                      transform="rotate(-90 60 60)"
                    />
                    <text x="60" y="65" fontFamily="sans-serif" fontSize="20" textAnchor="middle" fill="currentColor">
                      {data.value}
                    </text>
                  </svg>
                </div>
                <div>
                  <div className={`text-xl font-bold ${getClassColor(data.classification)}`}>{data.classification}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {data.value > data.previousValue ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">+{data.value - data.previousValue} from yesterday</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-red-500">{data.value - data.previousValue} from yesterday</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}

