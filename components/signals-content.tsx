"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Filter, RefreshCw } from "lucide-react"
import { IntradaySignalsList } from "@/components/intraday-signals-list"
import { fetchTickerData, fetchKlines } from "@/lib/binance-api"
import { findSupportResistanceZones, type SRZone } from "@/lib/support-resistance"

export function SignalsContent() {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [supportResistanceLevels, setSupportResistanceLevels] = useState<SRZone[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch current price and S/R levels
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch current price
        const tickerData = await fetchTickerData("BTC")
        if (tickerData && tickerData.lastPrice) {
          setCurrentPrice(Number(tickerData.lastPrice))
        } else {
          throw new Error("Failed to fetch current price")
        }

        // Fetch daily candles for S/R calculation
        const dailyCandles = await fetchKlines("1d", 90, undefined, "BTC")
        if (!dailyCandles || dailyCandles.length === 0) {
          throw new Error("Failed to fetch daily candles")
        }

        // Calculate S/R zones based on volume profile
        const srZones = await findSupportResistanceZones(dailyCandles, Number(tickerData.lastPrice))
        setSupportResistanceLevels(srZones)
      } catch (err) {
        console.error("Failed to fetch market data:", err)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    }

    fetchData()
    // Refresh data every 15 minutes
    const interval = setInterval(fetchData, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    // Fetch data again
    const fetchData = async () => {
      try {
        // Fetch current price
        const tickerData = await fetchTickerData("BTC")
        if (tickerData && tickerData.lastPrice) {
          setCurrentPrice(Number(tickerData.lastPrice))
        }

        // Fetch daily candles for S/R calculation
        const dailyCandles = await fetchKlines("1d", 90, undefined, "BTC")
        if (dailyCandles && dailyCandles.length > 0) {
          // Calculate S/R zones based on volume profile
          const srZones = await findSupportResistanceZones(dailyCandles, Number(tickerData.lastPrice))
          setSupportResistanceLevels(srZones)
        }
      } catch (err) {
        console.error("Failed to refresh market data:", err)
      } finally {
        setRefreshing(false)
      }
    }
    fetchData()
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trading Signals</h1>
          <p className="text-muted-foreground">Real-time trading signals based on technical analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 24 Hours
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="default" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intraday Trading Signals</CardTitle>
          <CardDescription>Based on S/R zones, price action, and historical patterns</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <IntradaySignalsList
              symbol="BTC"
              supportResistanceLevels={supportResistanceLevels}
              currentPrice={currentPrice || 0}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

