"use client"

import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    TradingView: any
  }
}

interface TradingViewChartProps {
  symbol: string
  interval?: string
  theme?: "light" | "dark"
  autosize?: boolean
  height?: number
}

export function TradingViewChart({
  symbol = "BTCUSDT",
  interval = "60",
  theme = "dark",
  autosize = true,
  height = 500,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    // Clear previous chart if any
    container.innerHTML = ""
    setIsLoading(true)
    setError(null)

    // Load TradingView widget
    try {
      const script = document.createElement("script")
      script.src = "https://s3.tradingview.com/tv.js"
      script.async = true
      script.onload = () => {
        if (typeof window.TradingView !== "undefined" && container) {
          new window.TradingView.widget({
            container_id: container.id,
            symbol: `BINANCE:${symbol}`,
            interval: interval,
            timezone: "Etc/UTC",
            theme: theme,
            style: "1",
            locale: "en",
            toolbar_bg: "#f1f3f6",
            enable_publishing: false,
            allow_symbol_change: false,
            save_image: false,
            studies: ["STD;Volume_Profile"],
            hide_top_toolbar: false,
            hide_legend: false,
            withdateranges: true,
            hide_side_toolbar: false,
            details: true,
            hotlist: true,
            calendar: true,
            show_popup_button: true,
            popup_width: "1000",
            popup_height: "650",
            autosize: autosize,
            height: height,
          })
          setIsLoading(false)
        }
      }
      script.onerror = () => {
        setError("Failed to load TradingView widget")
        setIsLoading(false)
      }
      document.head.appendChild(script)

      return () => {
        // Clean up
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      }
    } catch (err) {
      console.error("Error initializing TradingView chart:", err)
      setError("Failed to initialize chart")
      setIsLoading(false)
    }
  }, [symbol, interval, theme, autosize, height])

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-red-500">{error}</div>
        </div>
      )}
      <div id="tradingview_chart" ref={containerRef} className="w-full h-full min-h-[500px]"></div>
    </div>
  )
}

