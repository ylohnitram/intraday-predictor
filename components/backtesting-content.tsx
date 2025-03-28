"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, Play, Settings } from "lucide-react"
import { BacktestResults } from "@/components/backtest-results"
import { StrategyComparison } from "@/components/strategy-comparison"
import { BacktestSettings } from "@/components/backtest-settings"

export function BacktestingContent() {
  const [activeTab, setActiveTab] = useState("results")

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Backtesting</h1>
          <p className="text-muted-foreground">Test trading strategies on historical data</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="default" size="sm">
            <Play className="mr-2 h-4 w-4" />
            Run Backtest
          </Button>
        </div>
      </div>

      <Tabs defaultValue="results" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="results">Backtest Results</TabsTrigger>
          <TabsTrigger value="comparison">Strategy Comparison</TabsTrigger>
          <TabsTrigger value="settings">Backtest Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Backtest Results</CardTitle>
              <CardDescription>Performance metrics for the selected strategy</CardDescription>
            </CardHeader>
            <CardContent>
              <BacktestResults />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Comparison</CardTitle>
              <CardDescription>Compare performance of different trading strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <StrategyComparison />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Backtest Settings</CardTitle>
              <CardDescription>Configure parameters for backtesting</CardDescription>
            </CardHeader>
            <CardContent>
              <BacktestSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

