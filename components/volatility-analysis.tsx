"use client"

import { useState, useEffect } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { analyzeVolatility, type VolatilityData } from "@/lib/volatility-data"
import { Loader2 } from "lucide-react"

export function VolatilityAnalysis() {
  const [loading, setLoading] = useState(true)
  const [sundayData, setSundayData] = useState<VolatilityData[]>([])
  const [mondayData, setMondayData] = useState<VolatilityData[]>([])
  const [weekdayData, setWeekdayData] = useState<VolatilityData[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await analyzeVolatility("1h", 90) // 90 days to get enough Sunday/Monday data
        setSundayData(data.sundayData)
        setMondayData(data.mondayData)
        setWeekdayData(data.weekdayData)
      } catch (error) {
        console.error("Error analyzing volatility:", error)
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
          <p className="mt-2 text-sm text-muted-foreground">Analyzing volatility patterns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sunday-monday">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sunday-monday">Sunday-Monday</TabsTrigger>
          <TabsTrigger value="weekday">Weekday</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>
        <TabsContent value="sunday-monday">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sunday Volatility</CardTitle>
                <CardDescription>Hourly volatility pattern on Sundays</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-hidden">
                  <ChartContainer
                    config={{
                      volatility: {
                        label: "Volatility %",
                        color: "hsl(var(--chart-3))",
                      },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sundayData}>
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="volatility"
                          stroke="var(--color-volatility)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monday Volatility</CardTitle>
                <CardDescription>Hourly volatility pattern on Mondays</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-hidden">
                  <ChartContainer
                    config={{
                      volatility: {
                        label: "Volatility %",
                        color: "hsl(var(--chart-4))",
                      },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mondayData}>
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="volatility"
                          stroke="var(--color-volatility)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="weekday">
          <Card>
            <CardHeader>
              <CardTitle>Weekday Volatility</CardTitle>
              <CardDescription>Average hourly volatility pattern on weekdays</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 overflow-hidden">
                <ChartContainer
                  config={{
                    volatility: {
                      label: "Volatility %",
                      color: "hsl(var(--chart-5))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weekdayData}>
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="volatility"
                        stroke="var(--color-volatility)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Volatility Comparison</CardTitle>
              <CardDescription>Compare volatility patterns across different days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 overflow-hidden">
                <ChartContainer
                  config={{
                    sunday: {
                      label: "Sunday",
                      color: "hsl(var(--chart-3))",
                    },
                    monday: {
                      label: "Monday",
                      color: "hsl(var(--chart-4))",
                    },
                    weekday: {
                      label: "Avg. Weekday",
                      color: "hsl(var(--chart-5))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart>
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        data={sundayData}
                        dataKey="volatility"
                        stroke="var(--color-sunday)"
                        name="Sunday"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        data={mondayData}
                        dataKey="volatility"
                        stroke="var(--color-monday)"
                        name="Monday"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        data={weekdayData}
                        dataKey="volatility"
                        stroke="var(--color-weekday)"
                        name="Avg. Weekday"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

