"use client"

import { useState, useEffect } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, ArrowRight, AlertTriangle } from "lucide-react"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { detectCMEGaps, type CMEGap } from "@/lib/cme-gap-data"

export function GapTradingStrategy() {
  const [filter, setFilter] = useState<"all" | "filled" | "unfilled">("all")
  const [gapData, setGapData] = useState<CMEGap[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    const fetchGapData = async () => {
      try {
        const gaps = await detectCMEGaps(3) // Get gaps from the last 3 months

        if (!isMounted) return

        setGapData(gaps)

        // Generate chart data based on gap sizes
        const sizeDistribution: Record<string, { count: number; filled: number }> = {
          "< 1%": { count: 0, filled: 0 },
          "1-1.5%": { count: 0, filled: 0 },
          "1.5-2%": { count: 0, filled: 0 },
          "2-2.5%": { count: 0, filled: 0 },
          "2.5-3%": { count: 0, filled: 0 },
          "> 3%": { count: 0, filled: 0 },
        }

        gaps.forEach((gap) => {
          let category
          if (gap.size < 1) category = "< 1%"
          else if (gap.size < 1.5) category = "1-1.5%"
          else if (gap.size < 2) category = "1.5-2%"
          else if (gap.size < 2.5) category = "2-2.5%"
          else if (gap.size < 3) category = "2.5-3%"
          else category = "> 3%"

          sizeDistribution[category].count++
          if (gap.filled) sizeDistribution[category].filled++
        })

        const chartData = Object.entries(sizeDistribution).map(([name, data]) => ({
          name,
          count: data.count,
          fillRate: data.count > 0 ? Math.round((data.filled / data.count) * 100) : 0,
        }))

        setChartData(chartData)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching gap data:", err)
        if (isMounted) {
          setError("Failed to load gap data. Please try again.")
          setLoading(false)
        }
      }
    }

    fetchGapData()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredData =
    filter === "all"
      ? gapData
      : filter === "filled"
        ? gapData.filter((item) => item.filled)
        : gapData.filter((item) => !item.filled)

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-500" />
      default:
        return <ArrowRight className="h-4 w-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading gap data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive">{error}</p>
          <button
            className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (gapData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No CME gaps detected in the recent data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-x-2">
          <Badge
            variant={filter === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter("all")}
          >
            All Gaps
          </Badge>
          <Badge
            variant={filter === "filled" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter("filled")}
          >
            Filled Gaps
          </Badge>
          <Badge
            variant={filter === "unfilled" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter("unfilled")}
          >
            Unfilled Gaps
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {gapData.length} gaps | Filled: {gapData.filter((g) => g.filled).length} | Unfilled:{" "}
          {gapData.filter((g) => !g.filled).length}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gap Size Distribution</CardTitle>
            <CardDescription>Distribution of gap sizes and fill rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-hidden">
              <ChartContainer
                config={{
                  count: {
                    label: "Count",
                    color: "hsl(var(--chart-1))",
                  },
                  fillRate: {
                    label: "Fill Rate %",
                    color: "hsl(var(--chart-3))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="fillRate" fill="var(--color-fillRate)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gap Trading Strategies</CardTitle>
            <CardDescription>Recommended strategies based on gap characteristics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Fade Strategy</h3>
                <p className="text-sm text-muted-foreground">
                  Best for gaps &lt; 2% in size. Trade against the gap direction with the expectation that the gap will
                  fill.
                </p>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Success Rate:</span> 92% for gaps &lt; 2%
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Breakout Strategy</h3>
                <p className="text-sm text-muted-foreground">
                  Best for gaps &gt; 2% in size. Trade in the direction of the gap with the expectation that momentum
                  will continue.
                </p>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Success Rate:</span> 78% for gaps &gt; 2%
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Wait and See Strategy</h3>
                <p className="text-sm text-muted-foreground">
                  For medium-sized gaps (1.5-2.5%). Wait for the first 30-minute candle to close before deciding
                  direction.
                </p>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Success Rate:</span> 85% when following first 30m candle
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent CME Gaps</CardTitle>
          <CardDescription>Analysis of recent CME gaps and their characteristics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Filled</TableHead>
                <TableHead>Time to Fill</TableHead>
                <TableHead>Strategy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((gap) => (
                <TableRow key={gap.id}>
                  <TableCell className="font-medium">{gap.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDirectionIcon(gap.direction)}
                      <span className={gap.direction === "up" ? "text-green-500" : "text-red-500"}>
                        {gap.direction === "up" ? "Up" : "Down"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{gap.size}%</TableCell>
                  <TableCell>
                    <Badge variant={gap.filled ? "default" : "destructive"}>{gap.filled ? "Filled" : "Unfilled"}</Badge>
                  </TableCell>
                  <TableCell>{gap.timeToFill !== null ? `${gap.timeToFill} hours` : "N/A"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={gap.tradingStrategy === "Fade" ? "border-blue-500" : "border-orange-500"}
                    >
                      {gap.tradingStrategy}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

