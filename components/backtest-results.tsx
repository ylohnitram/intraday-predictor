"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, LineChart, Save, Share, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchBacktestResults } from "@/lib/backtest-data"

interface BacktestResultsProps {
  strategy: string
  timeframe: string
  period: string
  symbol?: string
}

export function BacktestResults({ strategy, timeframe, period, symbol = "BTC" }: BacktestResultsProps) {
  const [activeTab, setActiveTab] = useState("performance")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Simulace uložení výsledků
  const handleSave = () => {
    setIsSaving(true)

    // Simulace API volání
    setTimeout(() => {
      setIsSaving(false)

      toast({
        title: "Backtest results saved",
        description: `${strategy} strategy results have been saved to your account.`,
        duration: 3000,
      })
    }, 1500)
  }

  // Získání výsledků backtestingu
  const results = fetchBacktestResults(strategy, timeframe, period, symbol)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Backtest Results</CardTitle>
            <CardDescription>
              Performance metrics for {strategy} strategy on {symbol} {timeframe} timeframe
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Results"}
            </Button>
            <Button variant="outline" size="sm">
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="performance">
              <TrendingUp className="mr-2 h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="trades">
              <BarChart className="mr-2 h-4 w-4" />
              Trades
            </TabsTrigger>
            <TabsTrigger value="equity">
              <LineChart className="mr-2 h-4 w-4" />
              Equity Curve
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total Return"
                value={`${results.totalReturn}%`}
                trend={results.totalReturn >= 0 ? "up" : "down"}
                description="Net profit/loss"
              />
              <MetricCard
                title="Win Rate"
                value={`${results.winRate}%`}
                trend={results.winRate >= 50 ? "up" : "down"}
                description="Profitable trades"
              />
              <MetricCard
                title="Profit Factor"
                value={results.profitFactor.toFixed(2)}
                trend={results.profitFactor >= 1.5 ? "up" : "neutral"}
                description="Gross profit/loss ratio"
              />
              <MetricCard
                title="Max Drawdown"
                value={`${results.maxDrawdown}%`}
                trend="down"
                description="Largest peak-to-trough decline"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Trade Statistics</h3>
                <div className="bg-muted/30 rounded-md p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Trades:</span>
                    <span>{results.totalTrades}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Winning Trades:</span>
                    <span className="text-green-500">{results.winningTrades}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Losing Trades:</span>
                    <span className="text-red-500">{results.losingTrades}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg. Holding Time:</span>
                    <span>{results.avgHoldingTime}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Risk Metrics</h3>
                <div className="bg-muted/30 rounded-md p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sharpe Ratio:</span>
                    <span>{results.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sortino Ratio:</span>
                    <span>{results.sortinoRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Calmar Ratio:</span>
                    <span>{results.calmarRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recovery Factor:</span>
                    <span>{results.recoveryFactor.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Return Metrics</h3>
              <div className="bg-muted/30 rounded-md p-3 space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Daily Return</span>
                    <div className="flex items-center gap-1">
                      <span className={results.dailyReturn >= 0 ? "text-green-500" : "text-red-500"}>
                        {results.dailyReturn >= 0 ? "+" : ""}
                        {results.dailyReturn}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Weekly Return</span>
                    <div className="flex items-center gap-1">
                      <span className={results.weeklyReturn >= 0 ? "text-green-500" : "text-red-500"}>
                        {results.weeklyReturn >= 0 ? "+" : ""}
                        {results.weeklyReturn}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Monthly Return</span>
                    <div className="flex items-center gap-1">
                      <span className={results.monthlyReturn >= 0 ? "text-green-500" : "text-red-500"}>
                        {results.monthlyReturn >= 0 ? "+" : ""}
                        {results.monthlyReturn}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Annual Return</span>
                    <div className="flex items-center gap-1">
                      <span className={results.annualReturn >= 0 ? "text-green-500" : "text-red-500"}>
                        {results.annualReturn >= 0 ? "+" : ""}
                        {results.annualReturn}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trades">
            <div className="space-y-4">
              <div className="border rounded-md">
                <div className="grid grid-cols-6 text-xs font-medium p-2 border-b bg-muted/50">
                  <div>Date</div>
                  <div>Type</div>
                  <div>Entry</div>
                  <div>Exit</div>
                  <div>Return</div>
                  <div>Duration</div>
                </div>
                <div className="divide-y">
                  {results.trades.map((trade, index) => (
                    <div key={index} className="grid grid-cols-6 text-xs p-2">
                      <div>{trade.date}</div>
                      <div>
                        <Badge variant={trade.type === "Long" ? "default" : "destructive"} className="text-[10px] h-4">
                          {trade.type}
                        </Badge>
                      </div>
                      <div>${trade.entry.toLocaleString()}</div>
                      <div>${trade.exit.toLocaleString()}</div>
                      <div className={trade.return >= 0 ? "text-green-500" : "text-red-500"}>
                        {trade.return >= 0 ? "+" : ""}
                        {trade.return}%
                      </div>
                      <div>{trade.duration}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Long Trades</h3>
                  <div className="bg-muted/30 rounded-md p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Count:</span>
                      <span>{results.longTrades}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Win Rate:</span>
                      <span>{results.longWinRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg. Return:</span>
                      <span className={results.longAvgReturn >= 0 ? "text-green-500" : "text-red-500"}>
                        {results.longAvgReturn >= 0 ? "+" : ""}
                        {results.longAvgReturn}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Short Trades</h3>
                  <div className="bg-muted/30 rounded-md p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Count:</span>
                      <span>{results.shortTrades}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Win Rate:</span>
                      <span>{results.shortWinRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg. Return:</span>
                      <span className={results.shortAvgReturn >= 0 ? "text-green-500" : "text-red-500"}>
                        {results.shortAvgReturn >= 0 ? "+" : ""}
                        {results.shortAvgReturn}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="equity">
            <div className="space-y-4">
              <div className="h-[300px] bg-muted/30 rounded-md flex items-center justify-center">
                <span className="text-muted-foreground">Equity curve chart will be displayed here</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Starting Capital"
                  value={`$${results.startingCapital.toLocaleString()}`}
                  trend="neutral"
                  description="Initial investment"
                />
                <MetricCard
                  title="Ending Capital"
                  value={`$${results.endingCapital.toLocaleString()}`}
                  trend={results.endingCapital > results.startingCapital ? "up" : "down"}
                  description="Final balance"
                />
                <MetricCard
                  title="Absolute Gain"
                  value={`$${(results.endingCapital - results.startingCapital).toLocaleString()}`}
                  trend={results.endingCapital > results.startingCapital ? "up" : "down"}
                  description="Total profit/loss"
                />
                <MetricCard
                  title="CAGR"
                  value={`${results.cagr}%`}
                  trend={results.cagr >= 0 ? "up" : "down"}
                  description="Compound annual growth rate"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface MetricCardProps {
  title: string
  value: string
  trend: "up" | "down" | "neutral"
  description: string
}

function MetricCard({ title, value, trend, description }: MetricCardProps) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="flex items-center gap-1">
        {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
        {trend === "down" && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
        <span
          className={`text-base font-bold ${
            trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : ""
          }`}
        >
          {value}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  )
}

