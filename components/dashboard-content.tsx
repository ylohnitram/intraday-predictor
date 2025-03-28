"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { PositionCalculator } from "@/components/position-calculator"
import { CustomChart } from "@/components/custom-chart"
import { BitcoinDominance } from "@/components/bitcoin-dominance"
import { FearGreedIndex } from "@/components/fear-greed-index"
import { CryptoNews } from "@/components/crypto-news"
import { fetchTickerData, fetchKlines } from "@/lib/binance-api"
import { findSupportResistanceZones, type SRZone } from "@/lib/support-resistance"

export function DashboardContent() {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supportResistanceLevels, setSupportResistanceLevels] = useState<SRZone[]>([])
  const [price, setPrice] = useState<string | null>(null)
  const [priceChangePercent, setPriceChangePercent] = useState<string | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTC")

  // Fetch current price and S/R levels
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // Fetch ticker data with retries
        let tickerData = null
        let retries = 0
        const maxRetries = 3

        while (!tickerData && retries < maxRetries) {
          try {
            tickerData = await fetchTickerData(selectedSymbol)
          } catch (error) {
            console.error(`Ticker data fetch attempt ${retries + 1} failed:`, error)
            retries++

            if (retries >= maxRetries) {
              console.warn("All ticker data fetch attempts failed, using fallback data")
              tickerData = {
                symbol: selectedSymbol,
                price: "65000.00",
                priceChangePercent: "0.00",
                volume: "0",
                source: "component-fallback",
              }
            } else {
              // Wait before retrying
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }
          }
        }

        setPrice(tickerData?.price || "65000.00")
        setPriceChangePercent(tickerData?.priceChangePercent || "0.00")
        setCurrentPrice(Number(tickerData?.price || 65000))

        // Fetch daily candles for S/R calculation with better error handling
        try {
          const dailyCandles = await fetchKlines("1d", 90, undefined, "BTC")
          if (dailyCandles && dailyCandles.length > 0) {
            // Calculate S/R zones based on volume profile
            const srZones = await findSupportResistanceZones(dailyCandles, Number(tickerData?.price || 85000))
            setSupportResistanceLevels(srZones)
          } else {
            // Use empty array if no candles
            setSupportResistanceLevels([])
          }
        } catch (candlesError) {
          console.error("Error fetching candles:", candlesError)
          // Use empty array if error
          setSupportResistanceLevels([])
        }

        setError(null)
      } catch (err) {
        console.error("Error in fetchData:", err)
        setError("Failed to fetch market data. Using fallback data.")
        // Ensure we have a current price even if everything fails
        if (!currentPrice) {
          setCurrentPrice(85000)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Refresh data every 15 minutes
    const interval = setInterval(fetchData, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Chart takes up 2/3 of the width */}
        <div className="col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle>BTC/USDT Chart</CardTitle>
              <CardDescription>Real-time price chart with VWAP and support/resistance zones</CardDescription>
            </CardHeader>
            <CardContent className="p-4 relative">
              <CustomChart symbol="BTC" supportResistanceLevels={supportResistanceLevels} />
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar takes up 1/3 of the width */}
        <div className="space-y-4">
          <BitcoinDominance />
          <FearGreedIndex />
          {loading ? (
            <Card>
              <CardContent className="flex h-[400px] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="flex h-[400px] items-center justify-center">
                <div className="text-center text-red-500">{error}</div>
              </CardContent>
            </Card>
          ) : (
            <PositionCalculator currentPrice={currentPrice || 87000} />
          )}
        </div>
      </div>

      {/* News section below the chart */}
      <CryptoNews />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Disclaimer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Trading Disclaimer</CardTitle>
            <CardDescription>Important information for traders</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert
              variant="warning"
              className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/50"
            >
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>Disclaimer:</strong> The information provided in this application is for educational and
                informational purposes only and should not be considered financial advice. Trading cryptocurrency
                involves significant risk, and approximately 80% of retail traders lose money when trading financial
                products. Always do your own research and consider your financial situation before making any investment
                decisions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

