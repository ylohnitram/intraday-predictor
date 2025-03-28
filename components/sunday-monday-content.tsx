"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Filter } from "lucide-react"
import { SundayMondayPatternAnalyzer } from "@/components/sunday-monday-pattern-analyzer"
import { GapTradingStrategy } from "@/components/gap-trading-strategy"
import { CountdownTimer } from "@/components/countdown-timer"

export function SundayMondayContent() {
  const [activeTab, setActiveTab] = useState("patterns")

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sunday-Monday Analysis</h1>
          <p className="text-muted-foreground">Specialized analysis for Sunday-Monday transitions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 12 Weeks
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="default" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            Live Mode
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next Trading Session</CardTitle>
          <CardDescription>Countdown to the next Monday trading session</CardDescription>
        </CardHeader>
        <CardContent>
          <CountdownTimer />
        </CardContent>
      </Card>

      <Tabs defaultValue="patterns" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patterns">Sunday-Monday Patterns</TabsTrigger>
          <TabsTrigger value="gaps">CME Gap Trading</TabsTrigger>
        </TabsList>
        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Sunday-Monday 30m Patterns</CardTitle>
              <CardDescription>Analysis of 30-minute patterns during Sunday-Monday transitions</CardDescription>
            </CardHeader>
            <CardContent>
              <SundayMondayPatternAnalyzer />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="gaps">
          <Card>
            <CardHeader>
              <CardTitle>CME Gap Trading Opportunities</CardTitle>
              <CardDescription>Analysis of CME gaps and trading opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <GapTradingStrategy />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

