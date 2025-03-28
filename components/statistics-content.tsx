"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, Download, Filter, ExternalLink } from "lucide-react"
import { PatternAnalyzer } from "@/components/pattern-analyzer"
import Link from "next/link"

export function StatisticsContent() {
  const [activeTab, setActiveTab] = useState("patterns")
  const isSundayOrMonday = new Date().getDay() === 0 || new Date().getDay() === 1

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistics</h1>
          <p className="text-muted-foreground">Historical data analysis and pattern recognition</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {isSundayOrMonday && (
        <Card className="bg-amber-500/10 border-amber-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-600 dark:text-amber-400">Sunday-Monday Trading Opportunities</CardTitle>
            <CardDescription>Special analysis available for today's market conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/statistics/sunday-monday" className="flex-1">
                <Button variant="outline" className="w-full border-amber-500/50 hover:bg-amber-500/10">
                  Sunday-Monday Pattern Analysis
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/statistics/cme-gaps" className="flex-1">
                <Button variant="outline" className="w-full border-amber-500/50 hover:bg-amber-500/10">
                  CME Gap Trading Opportunities
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all-patterns" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-patterns">All Patterns</TabsTrigger>
          <TabsTrigger value="bullish-patterns">Bullish Patterns</TabsTrigger>
          <TabsTrigger value="bearish-patterns">Bearish Patterns</TabsTrigger>
        </TabsList>
        <TabsContent value="all-patterns">
          <Card>
            <CardHeader>
              <CardTitle>Price Patterns</CardTitle>
              <CardDescription>Common intraday patterns and their success rates</CardDescription>
            </CardHeader>
            <CardContent>
              <PatternAnalyzer patternType="all" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bullish-patterns">
          <Card>
            <CardHeader>
              <CardTitle>Bullish Price Patterns</CardTitle>
              <CardDescription>Bullish patterns and their success rates</CardDescription>
            </CardHeader>
            <CardContent>
              <PatternAnalyzer patternType="bullish" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bearish-patterns">
          <Card>
            <CardHeader>
              <CardTitle>Bearish Price Patterns</CardTitle>
              <CardDescription>Bearish patterns and their success rates</CardDescription>
            </CardHeader>
            <CardContent>
              <PatternAnalyzer patternType="bearish" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/statistics/sunday-monday">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Sunday-Monday Analysis</CardTitle>
              <CardDescription>Specialized analysis for Sunday-Monday transitions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Examine Bitcoin's behavior during the critical weekend-to-weekday transition period, including
                historical patterns and success rates.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/statistics/cme-gaps">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>CME Gap Analysis</CardTitle>
              <CardDescription>Trading opportunities from CME futures gaps</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Analyze price gaps created when the CME futures market closes for weekends, and track their fill rates
                and trading strategies.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

