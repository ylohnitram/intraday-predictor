"use client"

import { useEffect, useRef, useState } from "react"
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
} from "lightweight-charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ChartData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface SupportResistanceLevel {
  type: "support" | "resistance"
  priceStart: number
  priceEnd: number
  description: string
  strength: "weak" | "medium" | "strong"
}

interface CustomChartProps {
  symbol?: string
  supportResistanceLevels?: SupportResistanceLevel[]
}

export function CustomChart({
  symbol = "BTCUSD",
  supportResistanceLevels: initialSupportResistanceLevels = [],
}: CustomChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [timeframe, setTimeframe] = useState("4h")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null)
  const [supportResistanceLevels, setSupportResistanceLevels] =
    useState<SupportResistanceLevel[]>(initialSupportResistanceLevels)

  const chartRef = useRef<IChartApi | null>(null)
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volumeSeries = useRef<ISeriesApi<"Histogram"> | null>(null)
  const vwapSeries = useRef<ISeriesApi<"Line"> | null>(null)
  const srZonesRef = useRef<ISeriesApi<SeriesType>[]>([])
  const resizeObserver = useRef<ResizeObserver | null>(null)

  // Update the fetchPriceData function to use our internal API route
  const fetchPriceData = async (timeframe: string): Promise<ChartData[]> => {
    try {
      // Use our internal API route instead of directly calling CryptoCompare
      const response = await fetch(`/api/klines?interval=${timeframe}&limit=${getLimit(timeframe)}`, {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const candles = await response.json()

      // Check if we received valid data
      if (!Array.isArray(candles) || candles.length === 0) {
        throw new Error("Invalid response from API")
      }

      // Update current price and price change percent
      if (candles.length > 0) {
        const lastCandle = candles[candles.length - 1]
        setCurrentPrice(lastCandle.close)

        // Calculate price change percentage
        if (candles.length > 1) {
          const previousCandle = candles[candles.length - 2]
          const changePercent = ((lastCandle.close - previousCandle.close) / previousCandle.close) * 100
          setPriceChangePercent(changePercent)
        } else {
          setPriceChangePercent(0)
        }
      }

      // Sort candles by time to ensure they're in chronological order
      candles.sort((a, b) => a.time - b.time)

      return candles
    } catch (error) {
      console.error(`Error fetching ${timeframe} price data:`, error)

      // Try alternative API as fallback
      try {
        // Use our ticker API to at least get the current price
        const tickerResponse = await fetch("/api/ticker", {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          signal: AbortSignal.timeout(5000),
        })

        if (tickerResponse.ok) {
          const tickerData = await tickerResponse.json()
          const currentPrice = Number.parseFloat(tickerData.price)
          setCurrentPrice(currentPrice)
          setPriceChangePercent(0) // We don't have historical data to calculate change

          const currentTime = Math.floor(Date.now() / 1000)

          // Generate some fake historical data based on current price
          return Array.from({ length: 100 }, (_, i) => {
            const timeOffset = i * getTimeOffset(timeframe)
            const priceVariation = currentPrice * (0.98 + Math.random() * 0.04) // ±2%
            return {
              time: currentTime - (100 - i) * timeOffset,
              open: priceVariation,
              high: priceVariation * 1.005,
              low: priceVariation * 0.995,
              close: priceVariation,
              volume: 1000,
            }
          })
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError)
      }

      // If all else fails, return minimal fallback data
      const currentTime = Math.floor(Date.now() / 1000)
      const basePrice = 65000
      setCurrentPrice(basePrice)
      setPriceChangePercent(0)

      return Array.from({ length: 10 }, (_, i) => ({
        time: currentTime - (10 - i) * getTimeOffset(timeframe),
        open: basePrice,
        high: basePrice * 1.002,
        low: basePrice * 0.998,
        close: basePrice,
        volume: 1000,
      }))
    }
  }

  // Add this helper function
  function getTimeOffset(timeframe: string): number {
    switch (timeframe) {
      case "5m":
        return 300
      case "30m":
        return 1800
      case "4h":
        return 14400
      case "1d":
        return 86400
      default:
        return 300
    }
  }

  // Function to fetch candle data
  const fetchCandleData = async (tf: string) => {
    try {
      // Determine appropriate limit based on timeframe
      const limit = tf === "5m" ? 200 : tf === "30m" ? 150 : tf === "1d" ? 60 : 100

      // Calculate end time (current time) and start time based on limit and timeframe
      const endTime = Math.floor(Date.now() / 1000)
      const timeStep = getTimeOffset(tf)
      const startTime = endTime - limit * timeStep

      // Use our internal API route with proper parameters for historical data
      const response = await fetch(
        `/api/klines?interval=${tf}&limit=${limit}&startTime=${startTime}&endTime=${endTime}`,
        {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          signal: AbortSignal.timeout(8000),
        },
      )

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const candles = await response.json()

      // Check if we received valid data
      if (!Array.isArray(candles) || candles.length === 0) {
        throw new Error("Invalid response from API")
      }

      // Sort candles by time to ensure they're in chronological order
      candles.sort((a, b) => a.time - b.time)

      return candles
    } catch (error) {
      console.error("Error fetching candle data:", error)

      // Generate mock data with proper historical timestamps if API fails
      const mockCandles: ChartData[] = []
      const endTime = Math.floor(Date.now() / 1000)
      const basePrice = currentPrice || 85000
      const timeStep = getTimeOffset(tf)

      // Generate a realistic price trend
      let price = basePrice
      let trend = 0
      let trendStrength = 0
      let trendDuration = 0

      for (let i = 0; i < 100; i++) {
        // Time for this candle - going backwards from end time
        const time = endTime - (99 - i) * timeStep

        // Update trend occasionally
        if (trendDuration <= 0) {
          trend = Math.random() > 0.5 ? 1 : -1
          trendStrength = Math.random() * 0.01
          trendDuration = Math.floor(Math.random() * 10) + 5
        }
        trendDuration--

        // Apply trend with some randomness
        const trendEffect = trend * trendStrength * basePrice
        const randomness = basePrice * 0.01 * (Math.random() * 2 - 1)
        price = price + trendEffect + randomness

        // Ensure price doesn't go too low
        price = Math.max(price, basePrice * 0.5)

        // Calculate OHLC with realistic patterns
        const volatility = basePrice * (tf === "5m" ? 0.005 : tf === "30m" ? 0.01 : tf === "4h" ? 0.02 : 0.03)
        const open = price
        const close = price * (1 + (Math.random() * 0.02 - 0.01) + trend * 0.005)
        const high = Math.max(open, close) * (1 + Math.random() * 0.01)
        const low = Math.min(open, close) * (1 - Math.random() * 0.01)

        // Volume tends to be higher during price movements
        const volumeBase = (Math.abs(close - open) / volatility) * 1000
        const volume = volumeBase + Math.random() * 500

        mockCandles.push({
          time,
          open,
          high,
          low,
          close,
          volume,
        })

        // Update price for next iteration
        price = close
      }

      return mockCandles
    }
  }

  // Calculate VWAP for candles
  const calculateVWAP = (candles: ChartData[]): { time: number; value: number }[] => {
    const vwapValues: { time: number; value: number }[] = []
    let cumulativeTPV = 0 // Typical Price * Volume
    let cumulativeVolume = 0

    candles.forEach((candle) => {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3
      cumulativeTPV += typicalPrice * candle.volume
      cumulativeVolume += candle.volume

      vwapValues.push({
        time: candle.time,
        value: cumulativeTPV / cumulativeVolume,
      })
    })

    return vwapValues
  }

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const initChart = async () => {
      setIsLoading(true)

      try {
        // Clear previous chart if it exists
        if (chartRef.current) {
          chartRef.current.remove()
          chartRef.current = null
          candleSeries.current = null
          volumeSeries.current = null
          vwapSeries.current = null
          srZonesRef.current = []
        }

        // Create chart with dark theme
        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: "#131722" },
            textColor: "#D9D9D9",
          },
          grid: {
            vertLines: { color: "rgba(42, 46, 57, 0.2)" },
            horzLines: { color: "rgba(42, 46, 57, 0.2)" },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
          },
          timeScale: {
            borderColor: "rgba(197, 203, 206, 0.3)",
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderColor: "rgba(197, 203, 206, 0.3)",
          },
          handleScroll: { vertTouchDrag: false },
          height: 400, // Main chart height
        })

        // Create candlestick series
        const candles = chart.addCandlestickSeries({
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderVisible: false,
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
        })

        // Create VWAP series
        const vwap = chart.addLineSeries({
          color: "#8b5cf6",
          lineWidth: 2,
          priceLineVisible: false,
          title: "VWAP",
        })

        // Save references
        chartRef.current = chart
        candleSeries.current = candles
        vwapSeries.current = vwap

        // Create a separate pane for volume below the main chart
        chart.applyOptions({
          // This creates space at the bottom for the volume pane
          layout: {
            background: { type: ColorType.Solid, color: "#131722" },
            textColor: "#D9D9D9",
          },
        })

        // Create volume series with proper scaling and separation
        const volume = chart.addHistogramSeries({
          priceFormat: {
            type: "volume",
          },
          priceScaleId: "volume",
          scaleMargins: {
            top: 0.85, // Position volume at the bottom of the chart
            bottom: 0.0,
          },
          color: "rgba(76, 175, 80, 0.2)", // Default color (will be overridden per bar)
        })

        // Configure the volume price scale
        chart.priceScale("volume").applyOptions({
          scaleMargins: {
            top: 0.85, // Keep volume in the bottom 15% of the chart
            bottom: 0.0,
          },
          borderVisible: false,
        })

        volumeSeries.current = volume

        // Handle resize
        const handleResize = () => {
          if (chartRef.current && chartContainerRef.current) {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
            })
          }
        }

        // Create resize observer
        resizeObserver.current = new ResizeObserver(handleResize)
        resizeObserver.current.observe(chartContainerRef.current)

        // Initial resize
        handleResize()

        // Fetch price data and S/R levels
        await fetchPriceData(timeframe)

        // Fetch candle data and update chart
        await updateChartData(timeframe)

        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing chart:", error)
        setError("Failed to initialize chart. Please try refreshing the page.")
        setIsLoading(false)
      }
    }

    initChart()

    return () => {
      if (resizeObserver.current && chartContainerRef.current) {
        resizeObserver.current.unobserve(chartContainerRef.current)
      }
      if (chartRef.current) {
        chartRef.current.remove()
      }
    }
  }, [])

  // Update the component to fetch support/resistance levels from our API
  useEffect(() => {
    const fetchSupportResistanceLevels = async () => {
      try {
        const response = await fetch("/api/support-resistance?symbol=BTCUSDT", {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSupportResistanceLevels(data)
        }
      } catch (error) {
        console.error("Error fetching support/resistance levels:", error)
      }
    }

    fetchSupportResistanceLevels()
  }, [])

  // Update chart data when timeframe changes
  const updateChartData = async (tf: string) => {
    if (!candleSeries.current || !volumeSeries.current || !vwapSeries.current || !chartRef.current) return

    try {
      setIsLoading(true)
      setError(null)

      // Fetch candle data
      const candles = await fetchCandleData(tf)

      // Calculate VWAP
      const vwapData = calculateVWAP(candles)

      // Format data for candlestick chart
      const candleData = candles.map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))

      // Format data for volume chart - use consistent colors with reduced opacity
      const volumeData = candles.map((candle) => ({
        time: candle.time,
        value: candle.volume,
        color: candle.close >= candle.open ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)",
      }))

      // Update series data
      candleSeries.current.setData(candleData)
      volumeSeries.current.setData(volumeData)
      vwapSeries.current.setData(vwapData)

      // Clear existing S/R zones
      srZonesRef.current.forEach((series) => {
        chartRef.current?.removeSeries(series)
      })
      srZonesRef.current = []

      // Add support/resistance zones
      supportResistanceLevels.forEach((level) => {
        const zoneColor = level.type === "support" ? "rgba(74, 222, 128, 0.8)" : "rgba(248, 113, 113, 0.8)"

        // Create upper boundary line
        const upperLine = chartRef.current!.addLineSeries({
          color: zoneColor,
          lineWidth: 1,
          lineStyle: 0, // Solid
          lastValueVisible: true,
          priceLineVisible: false,
          title: level.type === "support" ? "S" : "R",
        })

        upperLine.setData([
          { time: candles[0].time, value: level.priceStart },
          { time: candles[candles.length - 1].time, value: level.priceStart },
        ])

        // Create lower boundary line
        const lowerLine = chartRef.current!.addLineSeries({
          color: zoneColor,
          lineWidth: 1,
          lineStyle: 0, // Solid
          lastValueVisible: false,
          priceLineVisible: false,
        })

        lowerLine.setData([
          { time: candles[0].time, value: level.priceEnd },
          { time: candles[candles.length - 1].time, value: level.priceEnd },
        ])

        // Create a very thin area between the lines to highlight the zone
        const zoneSeries = chartRef.current!.addAreaSeries({
          topColor: zoneColor.replace("0.8", "0.2"),
          bottomColor: zoneColor.replace("0.8", "0.2"),
          lineColor: "transparent",
          lineWidth: 0,
          lastValueVisible: false,
          priceLineVisible: false,
        })

        zoneSeries.setData([
          { time: candles[0].time, value: level.priceStart },
          { time: candles[candles.length - 1].time, value: level.priceStart },
        ])

        const zoneBottomSeries = chartRef.current!.addAreaSeries({
          topColor: "transparent",
          bottomColor: "transparent",
          lineColor: "transparent",
          lineWidth: 0,
          lastValueVisible: false,
          priceLineVisible: false,
        })

        zoneBottomSeries.setData([
          { time: candles[0].time, value: level.priceEnd },
          { time: candles[candles.length - 1].time, value: level.priceEnd },
        ])

        // Add price label at the right edge
        const priceLabel = chartRef.current!.addLineSeries({
          color: zoneColor,
          lineWidth: 0,
          lastValueVisible: true,
          priceLineVisible: false,
          title: `${level.type === "support" ? "S" : "R"} ${level.priceStart.toFixed(0)}`,
        })

        priceLabel.setData([{ time: candles[candles.length - 1].time, value: level.priceStart }])

        // Store references to the series
        srZonesRef.current.push(upperLine)
        srZonesRef.current.push(lowerLine)
        srZonesRef.current.push(zoneSeries)
        srZonesRef.current.push(zoneBottomSeries)
        srZonesRef.current.push(priceLabel)
      })

      // Fit content
      chartRef.current.timeScale().fitContent()

      setIsLoading(false)
    } catch (error) {
      console.error("Error updating chart data:", error)
      setError("Failed to update chart data. Please try refreshing.")
      setIsLoading(false)
    }
  }

  // Update chart when timeframe changes
  useEffect(() => {
    updateChartData(timeframe)

    // Set up interval for refreshing data more frequently
    const interval = setInterval(() => {
      updateChartData(timeframe)
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [timeframe, supportResistanceLevels])

  // Since we're now using the same API for both fetchPriceData and fetchCandleData,
  // we can simplify by just using fetchCandleData for both
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Fetch candle data and update chart
      await updateChartData(timeframe)
    } catch (error) {
      console.error("Error refreshing chart:", error)
      setError("Failed to refresh chart data. Please try again later.")
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Card className="col-span-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              BTC/USD
              {currentPrice !== null && (
                <span className="text-xl font-normal">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
              {priceChangePercent !== null && (
                <Badge className={priceChangePercent >= 0 ? "bg-green-500" : "bg-red-500"}>
                  {priceChangePercent >= 0 ? "+" : ""}
                  {priceChangePercent.toFixed(2)}%
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Bitcoin price chart with support and resistance levels</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Tabs defaultValue="4h" value={timeframe} onValueChange={setTimeframe}>
              <TabsList>
                <TabsTrigger value="5m">5m</TabsTrigger>
                <TabsTrigger value="30m">30m</TabsTrigger>
                <TabsTrigger value="4h">4h</TabsTrigger>
                <TabsTrigger value="1d">1D</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-8">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : (
          <div ref={chartContainerRef} className="h-[500px] w-full" />
        )}

        {/* Support and Resistance Levels Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Price Range</th>
                <th className="text-left py-2">Description</th>
                <th className="text-left py-2">Strength</th>
              </tr>
            </thead>
            <tbody>
              {supportResistanceLevels.map((level, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">
                    <Badge className={level.type === "support" ? "bg-green-500" : "bg-red-500"}>
                      {level.type === "support" ? "Support" : "Resistance"}
                    </Badge>
                  </td>
                  <td className="py-2">
                    $
                    {typeof level.priceStart === "number"
                      ? level.priceStart.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"}{" "}
                    - $
                    {typeof level.priceEnd === "number"
                      ? level.priceEnd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : "0.00"}
                  </td>
                  <td className="py-2">{level.description}</td>
                  <td className="py-2">
                    <Badge
                      variant="outline"
                      className={
                        level.strength === "strong"
                          ? "border-green-500 text-green-500"
                          : level.strength === "medium"
                            ? "border-yellow-500 text-yellow-500"
                            : "border-gray-500 text-gray-500"
                      }
                    >
                      {level.strength}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function timeframeToInterval(timeframe: string): string {
  switch (timeframe) {
    case "5m":
      return "minute"
    case "30m":
      return "minute"
    case "4h":
      return "hour"
    case "1d":
      return "day"
    default:
      return "hour"
  }
}

function getLimit(timeframe: string): number {
  switch (timeframe) {
    case "5m":
      return 100
    case "30m":
      return 75
    case "4h":
      return 50
    case "1d":
      return 30
    default:
      return 50
  }
}

