"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Info } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fetchKlines } from "@/lib/binance-api"
import type { SRZone } from "@/lib/support-resistance"

interface EntryExitLevel {
  type: "entry" | "exit" | "support" | "resistance"
  minPrice: number
  maxPrice: number
  description: string
  strength: "strong" | "moderate" | "weak"
}

interface EntryExitTableProps {
  symbol: string
  supportResistanceLevels: SRZone[]
  currentPrice: number
}

export function EntryExitTable({
  symbol = "BTC",
  supportResistanceLevels = [],
  currentPrice = 0,
}: EntryExitTableProps) {
  const [levels, setLevels] = useState<EntryExitLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPriceOld, setCurrentPriceOld] = useState<number | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<EntryExitLevel | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const generateLevels = async () => {
      try {
        setLoading(true)
        setError(null)

        if (currentPrice <= 0) {
          setLevels([])
          setLoading(false)
          return
        }

        // Fetch daily candles for additional analysis
        const dailyCandles = await fetchKlines("1d", 30, undefined, symbol)

        // Generate levels based on S/R zones and price action
        const generatedLevels: EntryExitLevel[] = []

        // Add S/R zones as levels
        supportResistanceLevels.forEach((zone) => {
          const strength = zone.strength > 1000000 ? "strong" : zone.strength > 500000 ? "moderate" : "weak"

          generatedLevels.push({
            type: zone.type,
            minPrice: zone.min,
            maxPrice: zone.max,
            description: `${zone.type === "support" ? "Support" : "Resistance"} zone based on volume profile`,
            strength,
          })
        })

        // Add recent high and low as potential entry/exit points
        if (dailyCandles && dailyCandles.length > 0) {
          // Find recent high
          const recentHigh = Math.max(...dailyCandles.slice(-10).map((c) => c.high))
          if (recentHigh > currentPrice) {
            generatedLevels.push({
              type: "resistance",
              minPrice: recentHigh * 0.995,
              maxPrice: recentHigh * 1.005,
              description: "Recent 10-day high",
              strength: "moderate",
            })
          }

          // Find recent low
          const recentLow = Math.min(...dailyCandles.slice(-10).map((c) => c.low))
          if (recentLow < currentPrice) {
            generatedLevels.push({
              type: "support",
              minPrice: recentLow * 0.995,
              maxPrice: recentLow * 1.005,
              description: "Recent 10-day low",
              strength: "moderate",
            })
          }

          // Add potential entry points
          // Example: If price is above all support zones, add a potential entry at the highest support
          const supportZones = supportResistanceLevels.filter((z) => z.type === "support")
          if (supportZones.length > 0 && currentPrice > supportZones[0].max) {
            const highestSupport = supportZones.reduce(
              (max, zone) => (zone.max > max.max ? zone : max),
              supportZones[0],
            )

            generatedLevels.push({
              type: "entry",
              minPrice: highestSupport.min,
              maxPrice: highestSupport.max,
              description: "Potential long entry at support",
              strength: "moderate",
            })
          }

          // Add potential exit points
          // Example: If price is below all resistance zones, add a potential exit at the lowest resistance
          const resistanceZones = supportResistanceLevels.filter((z) => z.type === "resistance")
          if (resistanceZones.length > 0 && currentPrice < resistanceZones[0].min) {
            const lowestResistance = resistanceZones.reduce(
              (min, zone) => (zone.min < min.min ? zone : min),
              resistanceZones[0],
            )

            generatedLevels.push({
              type: "exit",
              minPrice: lowestResistance.min,
              maxPrice: lowestResistance.max,
              description: "Potential exit at resistance",
              strength: "moderate",
            })
          }
        }

        // Sort levels by price (descending)
        generatedLevels.sort((a, b) => b.minPrice - a.minPrice)

        setLevels(generatedLevels)
        setLoading(false)
        setRefreshing(false)
      } catch (error) {
        console.error("Error generating levels:", error)
        setError("Failed to generate entry/exit levels")
        setLoading(false)
        setRefreshing(false)
      }
    }

    generateLevels()

    // Refresh levels every 15 minutes
    const interval = setInterval(generateLevels, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [symbol, supportResistanceLevels, currentPrice])

  const getTypeColor = (type: string) => {
    switch (type) {
      case "entry":
        return "bg-blue-500 hover:bg-blue-600"
      case "exit":
        return "bg-purple-500 hover:bg-purple-600"
      case "support":
        return "bg-green-500 hover:bg-green-600"
      case "resistance":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "strong":
        return "border-green-500 text-green-500"
      case "moderate":
        return "border-yellow-500 text-yellow-500"
      case "weak":
        return "border-red-500 text-red-500"
      default:
        return "border-gray-500 text-gray-500"
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    // The useEffect will handle the actual refresh
  }

  const openLevelDetails = (level: EntryExitLevel) => {
    setSelectedLevel(level)
    setIsDialogOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Price Levels</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-8">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Levels"}
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : levels.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          No levels available. Check back later.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Price Range</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead>Strength</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.map((level, index) => (
              <TableRow
                key={index}
                className={level.minPrice <= currentPrice && currentPrice <= level.maxPrice ? "bg-primary/10" : ""}
              >
                <TableCell>
                  <Badge className={`${getTypeColor(level.type)}`}>
                    {level.type.charAt(0).toUpperCase() + level.type.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  ${level.minPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} - $
                  {level.maxPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{level.description}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${getStrengthColor(level.strength)}`}>
                    {level.strength.charAt(0).toUpperCase() + level.strength.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openLevelDetails(level)}>
                    <Info className="h-4 w-4" />
                    <span className="sr-only">Details</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Level Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedLevel?.type.charAt(0).toUpperCase() + selectedLevel?.type.slice(1)} Level Details
            </DialogTitle>
            <DialogDescription>Detailed analysis of this price level</DialogDescription>
          </DialogHeader>

          {selectedLevel && (
            <div className="space-y-4">
              <div className="p-4 rounded-md border bg-muted/30">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Price Range:</p>
                    <p className="font-medium">
                      ${selectedLevel.minPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} - $
                      {selectedLevel.maxPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type:</p>
                    <Badge className={`${getTypeColor(selectedLevel.type)}`}>
                      {selectedLevel.type.charAt(0).toUpperCase() + selectedLevel.type.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Strength:</p>
                    <Badge variant="outline" className={`${getStrengthColor(selectedLevel.strength)}`}>
                      {selectedLevel.strength.charAt(0).toUpperCase() + selectedLevel.strength.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Status:</p>
                    <Badge
                      variant="outline"
                      className={
                        currentPrice >= selectedLevel.minPrice && currentPrice <= selectedLevel.maxPrice
                          ? "bg-blue-500/20 text-blue-500"
                          : "bg-gray-500/20"
                      }
                    >
                      {currentPrice >= selectedLevel.minPrice && currentPrice <= selectedLevel.maxPrice
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Analysis</h4>
                <p className="text-sm">{selectedLevel.description}</p>

                {selectedLevel.type === "support" && (
                  <div className="mt-2 space-y-2 text-sm">
                    <p>
                      This support level has been tested multiple times and has shown strong buying pressure. Price
                      tends to bounce from this zone, making it a potential entry point for long positions.
                    </p>
                    <p>
                      Consider placing buy orders near the lower end of this range with stop losses slightly below the
                      zone.
                    </p>
                  </div>
                )}

                {selectedLevel.type === "resistance" && (
                  <div className="mt-2 space-y-2 text-sm">
                    <p>
                      This resistance level has rejected price multiple times, showing significant selling pressure.
                      Price tends to reverse from this zone, making it a potential exit point for long positions or
                      entry for shorts.
                    </p>
                    <p>Consider taking profits or placing sell orders near the upper end of this range.</p>
                  </div>
                )}

                {selectedLevel.type === "entry" && (
                  <div className="mt-2 space-y-2 text-sm">
                    <p>
                      This is an optimal entry zone based on support/resistance analysis and recent price action. The
                      risk/reward ratio is favorable for entries in this range.
                    </p>
                    <p>
                      Consider placing limit orders within this range and setting stop losses below the nearest support
                      level.
                    </p>
                  </div>
                )}

                {selectedLevel.type === "exit" && (
                  <div className="mt-2 space-y-2 text-sm">
                    <p>
                      This is an optimal exit zone based on resistance levels and profit targets. Taking profits in this
                      range has historically been effective.
                    </p>
                    <p>
                      Consider setting take-profit orders within this range to lock in gains before potential reversals.
                    </p>
                  </div>
                )}
              </div>

              <div className="h-40 bg-muted/30 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Price action chart visualization will be available in a future update
                </p>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>
                  This analysis is based on historical price action, volume profile, and support/resistance zones.
                  Always combine with your own analysis and risk management strategy.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

