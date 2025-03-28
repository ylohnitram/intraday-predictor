"use client"

import { useState, useEffect } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { analyzeTimeframes, type TimeframeData, type TimeframeChartData } from "@/lib/timeframe-data"
import { Loader2 } from "lucide-react"

export function TimeframePerformance() {
  const [loading, setLoading] = useState(true)
  const [timeframeData, setTimeframeData] = useState<TimeframeData[]>([])
  const [chartData, setChartData] = useState<TimeframeChartData[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await analyzeTimeframes(30)
        setTimeframeData(data.timeframeData)
        setChartData(data.chartData)
      } catch (error) {
        console.error("Error analyzing timeframes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Analyzing timeframe performance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="h-80 overflow-hidden">
        <ChartContainer
          config={{
            winRate: {
              label: "Win Rate %",
              color: "hsl(var(--chart-1))",
            },
            profitFactor: {
              label: "Profit Factor (x20)",
              color: "hsl(var(--chart-3))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="winRate" fill="var(--color-winRate)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profitFactor" fill="var(--color-profitFactor)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timeframe</TableHead>
            <TableHead>Win Rate</TableHead>
            <TableHead>Profit Factor</TableHead>
            <TableHead>Avg. Trades/Day</TableHead>
            <TableHead>Avg. Return/Trade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timeframeData.map((item) => (
            <TableRow key={item.timeframe}>
              <TableCell className="font-medium">{item.timeframe}</TableCell>
              <TableCell className={item.winRate > 60 ? "text-green-500" : ""}>{item.winRate}%</TableCell>
              <TableCell className={item.profitFactor > 1.5 ? "text-green-500" : ""}>
                {item.profitFactor.toFixed(1)}
              </TableCell>
              <TableCell>{item.avgTrades.toFixed(1)}</TableCell>
              <TableCell>{item.avgReturn.toFixed(1)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

