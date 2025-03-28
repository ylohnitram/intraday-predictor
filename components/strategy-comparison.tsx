"use client"

import { useState, useEffect } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { compareStrategies, type StrategyPerformance } from "@/lib/backtest-data"
import { Loader2 } from "lucide-react"

export function StrategyComparison() {
  const [loading, setLoading] = useState(true)
  const [strategyData, setStrategyData] = useState<StrategyPerformance[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await compareStrategies("30m", 30)
        setStrategyData(data)

        // Prepare chart data
        const chartData = data.map((strategy) => ({
          name: strategy.name.replace(" Following", "").replace("Support/Resistance", "S/R"),
          winRate: strategy.winRate,
          profitFactor: strategy.profitFactor * 20,
          return: strategy.return,
        }))

        setChartData(chartData)
      } catch (error) {
        console.error("Error fetching strategy comparison data:", error)
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
          <p className="mt-2 text-sm text-muted-foreground">Comparing strategies...</p>
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
            return: {
              label: "Return %",
              color: "hsl(var(--chart-4))",
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
              <Bar dataKey="return" fill="var(--color-return)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Strategy</TableHead>
            <TableHead>Win Rate</TableHead>
            <TableHead>Profit Factor</TableHead>
            <TableHead>Max Drawdown</TableHead>
            <TableHead>Sharpe</TableHead>
            <TableHead>Return</TableHead>
            <TableHead>Trades</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {strategyData.map((strategy) => (
            <TableRow key={strategy.name}>
              <TableCell className="font-medium">{strategy.name}</TableCell>
              <TableCell className={strategy.winRate > 65 ? "text-green-500" : ""}>{strategy.winRate}%</TableCell>
              <TableCell className={strategy.profitFactor > 1.8 ? "text-green-500" : ""}>
                {strategy.profitFactor}
              </TableCell>
              <TableCell className={strategy.maxDrawdown < 6 ? "text-green-500" : "text-red-500"}>
                -{strategy.maxDrawdown}%
              </TableCell>
              <TableCell className={strategy.sharpe > 1.7 ? "text-green-500" : ""}>{strategy.sharpe}</TableCell>
              <TableCell className="text-green-500">+{strategy.return}%</TableCell>
              <TableCell>{strategy.trades}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

