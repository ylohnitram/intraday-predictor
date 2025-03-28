"use client"

import { useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, ArrowRight } from "lucide-react"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

// Sample data for Sunday-Monday patterns
const patternData = [
  { id: 1, time: "Sunday 20:00-20:30", direction: "up", probability: 68, avgMove: 1.2, volume: "Medium" },
  { id: 2, time: "Sunday 20:30-21:00", direction: "up", probability: 72, avgMove: 1.5, volume: "Medium" },
  { id: 3, time: "Sunday 21:00-21:30", direction: "up", probability: 65, avgMove: 0.9, volume: "Low" },
  { id: 4, time: "Sunday 21:30-22:00", direction: "neutral", probability: 52, avgMove: 0.4, volume: "Low" },
  { id: 5, time: "Sunday 22:00-22:30", direction: "neutral", probability: 55, avgMove: 0.5, volume: "Low" },
  { id: 6, time: "Sunday 22:30-23:00", direction: "down", probability: 62, avgMove: 0.8, volume: "Medium" },
  { id: 7, time: "Sunday 23:00-23:30", direction: "down", probability: 58, avgMove: 0.7, volume: "Medium" },
  { id: 8, time: "Sunday 23:30-00:00", direction: "down", probability: 60, avgMove: 0.9, volume: "Medium" },
  { id: 9, time: "Monday 00:00-00:30", direction: "down", probability: 64, avgMove: 1.1, volume: "High" },
  { id: 10, time: "Monday 00:30-01:00", direction: "neutral", probability: 53, avgMove: 0.5, volume: "Medium" },
  { id: 11, time: "Monday 01:00-01:30", direction: "up", probability: 58, avgMove: 0.7, volume: "Medium" },
  { id: 12, time: "Monday 01:30-02:00", direction: "up", probability: 62, avgMove: 0.9, volume: "Medium" },
  { id: 13, time: "Monday 02:00-02:30", direction: "up", probability: 70, avgMove: 1.3, volume: "High" },
  { id: 14, time: "Monday 02:30-03:00", direction: "up", probability: 75, avgMove: 1.6, volume: "High" },
  { id: 15, time: "Monday 03:00-03:30", direction: "up", probability: 68, avgMove: 1.2, volume: "High" },
  { id: 16, time: "Monday 03:30-04:00", direction: "neutral", probability: 54, avgMove: 0.6, volume: "Medium" },
]

// Chart data for price movement probability
const chartData = patternData.map((item) => ({
  time: item.time.split(" ")[1], // Extract just the time part
  probability: item.probability,
  avgMove: item.avgMove * 20, // Scale for better visualization
  day: item.time.split(" ")[0], // Extract just the day part
}))

export function SundayMondayPatternAnalyzer() {
  const [selectedDay, setSelectedDay] = useState<"all" | "sunday" | "monday">("all")

  const filteredData =
    selectedDay === "all" ? patternData : patternData.filter((item) => item.time.toLowerCase().includes(selectedDay))

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

  const getVolumeColor = (volume: string) => {
    switch (volume) {
      case "High":
        return "bg-green-500 text-white"
      case "Medium":
        return "bg-yellow-500 text-white"
      case "Low":
        return "bg-gray-500 text-white"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-x-2">
          <Badge
            variant={selectedDay === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedDay("all")}
          >
            All
          </Badge>
          <Badge
            variant={selectedDay === "sunday" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedDay("sunday")}
          >
            Sunday
          </Badge>
          <Badge
            variant={selectedDay === "monday" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedDay("monday")}
          >
            Monday
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-xs">Bullish</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-xs">Bearish</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-gray-400" />
            <span className="text-xs">Neutral</span>
          </div>
        </div>
      </div>

      <div className="h-80 overflow-hidden">
        <ChartContainer
          config={{
            probability: {
              label: "Probability %",
              color: "hsl(var(--chart-1))",
            },
            avgMove: {
              label: "Avg. Move (x20)",
              color: "hsl(var(--chart-3))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="probability"
                stroke="var(--color-probability)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line type="monotone" dataKey="avgMove" stroke="var(--color-avgMove)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>30m Pattern Analysis</CardTitle>
            <CardDescription>Detailed breakdown of 30-minute patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Avg. Move</TableHead>
                  <TableHead>Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((pattern) => (
                  <TableRow key={pattern.id}>
                    <TableCell className="font-medium">{pattern.time}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDirectionIcon(pattern.direction)}
                        <span className={`signal-${pattern.direction}`}>
                          {pattern.direction === "up"
                            ? "Bullish"
                            : pattern.direction === "down"
                              ? "Bearish"
                              : "Neutral"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={pattern.probability > 65 ? "text-green-500" : ""}>
                      {pattern.probability}%
                    </TableCell>
                    <TableCell>{pattern.avgMove}%</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getVolumeColor(pattern.volume)}>
                        {pattern.volume}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>High Probability Entry Points</CardTitle>
            <CardDescription>Best entry opportunities based on historical data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patternData
                .filter((pattern) => pattern.probability > 65)
                .sort((a, b) => b.probability - a.probability)
                .slice(0, 5)
                .map((pattern) => (
                  <div key={pattern.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getDirectionIcon(pattern.direction)}
                        <span className="font-medium">{pattern.time}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg. Move: {pattern.avgMove}% • Volume: {pattern.volume}
                      </div>
                    </div>
                    <Badge
                      className={
                        pattern.direction === "up"
                          ? "bg-green-500 text-white"
                          : pattern.direction === "down"
                            ? "bg-red-500 text-white"
                            : "bg-gray-400 text-white"
                      }
                    >
                      {pattern.probability}% Probability
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

