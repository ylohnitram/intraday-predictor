"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react"

interface GapData {
  date: string
  gapSize: number
  gapDirection: "up" | "down"
  fillTime: number // in hours
  filled: boolean
}

interface WeekendData {
  date: string
  fridayClose: number
  mondayOpen: number
  percentChange: number
  direction: "up" | "down"
}

export function SundayMondayAnalysis() {
  const [weekendData, setWeekendData] = useState<WeekendData[]>([])
  const [gapData, setGapData] = useState<GapData[]>([])
  const [loading, setLoading] = useState(true)

  // Statistics
  const [upGaps, setUpGaps] = useState(0)
  const [downGaps, setDownGaps] = useState(0)
  const [filledGaps, setFilledGaps] = useState(0)
  const [averageFillTime, setAverageFillTime] = useState(0)

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      // Sample weekend data
      const weekends: WeekendData[] = [
        { date: "2023-12-01", fridayClose: 37800, mondayOpen: 38200, percentChange: 1.06, direction: "up" },
        { date: "2023-12-08", fridayClose: 43500, mondayOpen: 42100, percentChange: -3.22, direction: "down" },
        { date: "2023-12-15", fridayClose: 41900, mondayOpen: 42300, percentChange: 0.95, direction: "up" },
        { date: "2023-12-22", fridayClose: 43800, mondayOpen: 42900, percentChange: -2.05, direction: "down" },
        { date: "2023-12-29", fridayClose: 42100, mondayOpen: 45600, percentChange: 8.31, direction: "up" },
        { date: "2024-01-05", fridayClose: 44200, mondayOpen: 44900, percentChange: 1.58, direction: "up" },
        { date: "2024-01-12", fridayClose: 46100, mondayOpen: 42800, percentChange: -7.16, direction: "down" },
        { date: "2024-01-19", fridayClose: 41500, mondayOpen: 40900, percentChange: -1.45, direction: "down" },
        { date: "2024-01-26", fridayClose: 39800, mondayOpen: 42300, percentChange: 6.28, direction: "up" },
        { date: "2024-02-02", fridayClose: 43100, mondayOpen: 42800, percentChange: -0.7, direction: "down" },
      ]

      // Sample gap data
      const gaps: GapData[] = [
        { date: "2023-12-04", gapSize: 400, gapDirection: "up", fillTime: 18, filled: true },
        { date: "2023-12-11", gapSize: 1400, gapDirection: "down", fillTime: 36, filled: true },
        { date: "2023-12-18", gapSize: 400, gapDirection: "up", fillTime: 12, filled: true },
        { date: "2023-12-25", gapSize: 900, gapDirection: "down", fillTime: 24, filled: true },
        { date: "2024-01-01", gapSize: 3500, gapDirection: "up", fillTime: 48, filled: true },
        { date: "2024-01-08", gapSize: 700, gapDirection: "up", fillTime: 20, filled: true },
        { date: "2024-01-15", gapSize: 3300, gapDirection: "down", fillTime: 72, filled: true },
        { date: "2024-01-22", gapSize: 600, gapDirection: "down", fillTime: 16, filled: true },
        { date: "2024-01-29", gapSize: 2500, gapDirection: "up", fillTime: 40, filled: true },
        { date: "2024-02-05", gapSize: 300, gapDirection: "down", fillTime: 10, filled: true },
      ]

      // Calculate statistics
      const upCount = gaps.filter((gap) => gap.gapDirection === "up").length
      const downCount = gaps.filter((gap) => gap.gapDirection === "down").length
      const filledCount = gaps.filter((gap) => gap.filled).length
      const avgFillTime = Math.round(gaps.reduce((sum, gap) => sum + gap.fillTime, 0) / gaps.length)

      setWeekendData(weekends)
      setGapData(gaps)
      setUpGaps(upCount)
      setDownGaps(downCount)
      setFilledGaps(filledCount)
      setAverageFillTime(avgFillTime)
      setLoading(false)
    }, 1000)
  }, [])

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Bitcoin Weekend Gap Analysis</CardTitle>
          <CardDescription>
            Analysis of Bitcoin price behavior between CME market close (Friday) and open (Monday)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="statistics">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="weekend-data">Weekend Data</TabsTrigger>
              <TabsTrigger value="cme-gaps">CME Gaps</TabsTrigger>
            </TabsList>

            <TabsContent value="statistics" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Gap Direction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">
                          <ArrowUpIcon className="mr-1 h-3 w-3" />
                          Up
                        </Badge>
                        <span className="text-2xl font-bold">{upGaps}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-red-500/10 text-red-500">
                          <ArrowDownIcon className="mr-1 h-3 w-3" />
                          Down
                        </Badge>
                        <span className="text-2xl font-bold">{downGaps}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Gap Fill Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{Math.round((filledGaps / (upGaps + downGaps)) * 100)}%</div>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                        {filledGaps} of {upGaps + downGaps} filled
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Fill Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{averageFillTime} hours</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Trading Insight</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      CME gaps occur when the Bitcoin futures market closes for the weekend while the spot market
                      continues trading. These gaps tend to be filled over time, with larger gaps having a higher
                      probability of being filled.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="weekend-data" className="pt-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-4 border-b bg-muted/50 p-2 font-medium">
                  <div>Date</div>
                  <div>Friday Close</div>
                  <div>Monday Open</div>
                  <div>Change</div>
                </div>
                <div className="divide-y">
                  {weekendData.map((weekend, index) => (
                    <div key={index} className="grid grid-cols-4 p-2">
                      <div>{weekend.date}</div>
                      <div>${weekend.fridayClose.toLocaleString()}</div>
                      <div>${weekend.mondayOpen.toLocaleString()}</div>
                      <div className={weekend.direction === "up" ? "text-green-500" : "text-red-500"}>
                        {weekend.direction === "up" ? "+" : ""}
                        {weekend.percentChange.toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cme-gaps" className="pt-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-4 border-b bg-muted/50 p-2 font-medium">
                  <div>Date</div>
                  <div>Gap Size</div>
                  <div>Direction</div>
                  <div>Fill Time</div>
                </div>
                <div className="divide-y">
                  {gapData.map((gap, index) => (
                    <div key={index} className="grid grid-cols-4 p-2">
                      <div>{gap.date}</div>
                      <div>${gap.gapSize.toLocaleString()}</div>
                      <div>
                        {gap.gapDirection === "up" ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500">
                            <TrendingUpIcon className="mr-1 h-3 w-3" />
                            Up
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-500">
                            <TrendingDownIcon className="mr-1 h-3 w-3" />
                            Down
                          </Badge>
                        )}
                      </div>
                      <div>{gap.fillTime} hours</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

