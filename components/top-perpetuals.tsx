"use client"

import { useState, useEffect } from "react"
import { fetchTopPerpetuals, type PerpetualInfo } from "@/lib/binance-market"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { CryptoIcon } from "@/components/crypto-icon"

interface TopPerpetualsProps {
  onSelectSymbol: (symbol: string) => void
  selectedSymbol: string
}

export function TopPerpetuals({ onSelectSymbol, selectedSymbol }: TopPerpetualsProps) {
  const [perpetuals, setPerpetuals] = useState<PerpetualInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPerpetuals() {
      try {
        setLoading(true)
        const data = await fetchTopPerpetuals(10)
        setPerpetuals(data)
      } catch (error) {
        console.error("Error loading perpetuals:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPerpetuals()

    // Refresh every 5 minutes
    const interval = setInterval(loadPerpetuals, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {Array(10)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-md" />
          ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
      {perpetuals.map((perpetual) => {
        const isSelected = selectedSymbol === perpetual.symbol
        const isPriceUp = perpetual.priceChangePercent >= 0

        return (
          <Button
            key={perpetual.symbol}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex items-center gap-2 h-auto py-1.5 px-3 min-w-[90px] transition-all duration-200",
              isSelected ? "shadow-md scale-105 border-2 border-primary" : "hover:bg-background/80",
              !isSelected && isPriceUp ? "hover:border-green-500/50" : "hover:border-red-500/50",
            )}
            onClick={() => onSelectSymbol(perpetual.symbol)}
          >
            <CryptoIcon symbol={perpetual.symbol} size={20} />
            <div className="flex flex-col items-start">
              <span className={cn("text-xs font-bold", isSelected ? "text-primary-foreground" : "")}>
                {perpetual.symbol}
              </span>
              <span
                className={cn(
                  "text-[10px]",
                  isPriceUp ? "text-green-500" : "text-red-500",
                  isSelected && isPriceUp ? "text-green-300" : "",
                  isSelected && !isPriceUp ? "text-red-300" : "",
                )}
              >
                {isPriceUp ? "+" : ""}
                {perpetual.priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </Button>
        )
      })}
    </div>
  )
}

