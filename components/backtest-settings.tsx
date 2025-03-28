"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Save } from "lucide-react"

export function BacktestSettings() {
  const [activeTab, setActiveTab] = useState("general")
  const [initialCapital, setInitialCapital] = useState(10000)
  const [positionSize, setPositionSize] = useState(10)
  const [slippage, setSlippage] = useState(0.05)
  const [commission, setCommission] = useState(0.1)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="risk">Risk Management</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="initialCapital">Initial Capital ($)</Label>
                <Input
                  id="initialCapital"
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateRange">Date Range</Label>
                <Select defaultValue="30days">
                  <SelectTrigger id="dateRange">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="1year">Last year</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timeframe">Timeframe</Label>
                <Select defaultValue="30m">
                  <SelectTrigger id="timeframe">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5m">5 minutes</SelectItem>
                    <SelectItem value="15m">15 minutes</SelectItem>
                    <SelectItem value="30m">30 minutes</SelectItem>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="4h">4 hours</SelectItem>
                    <SelectItem value="1d">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataSource">Data Source</Label>
                <Select defaultValue="binance">
                  <SelectTrigger id="dataSource">
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binance">Binance</SelectItem>
                    <SelectItem value="coinbase">Coinbase</SelectItem>
                    <SelectItem value="kraken">Kraken</SelectItem>
                    <SelectItem value="custom">Custom data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="commission">Commission (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slippage">Slippage (%)</Label>
                <Input
                  id="slippage"
                  type="number"
                  step="0.01"
                  value={slippage}
                  onChange={(e) => setSlippage(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="includeFees" />
              <Label htmlFor="includeFees">Include trading fees in backtest</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="includeSlippage" defaultChecked />
              <Label htmlFor="includeSlippage">Include slippage in backtest</Label>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="strategy">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="strategyType">Strategy Type</Label>
                <Select defaultValue="momentum">
                  <SelectTrigger id="strategyType">
                    <SelectValue placeholder="Select strategy type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="momentum">Momentum</SelectItem>
                    <SelectItem value="trend">Trend Following</SelectItem>
                    <SelectItem value="breakout">Breakout</SelectItem>
                    <SelectItem value="support">Support/Resistance</SelectItem>
                    <SelectItem value="gap">Gap Trading</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entryCondition">Entry Condition</Label>
                <Select defaultValue="crossover">
                  <SelectTrigger id="entryCondition">
                    <SelectValue placeholder="Select entry condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crossover">MA Crossover</SelectItem>
                    <SelectItem value="rsi">RSI Threshold</SelectItem>
                    <SelectItem value="price">Price Action</SelectItem>
                    <SelectItem value="volume">Volume Spike</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exitCondition">Exit Condition</Label>
                <Select defaultValue="takeProfit">
                  <SelectTrigger id="exitCondition">
                    <SelectValue placeholder="Select exit condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="takeProfit">Take Profit</SelectItem>
                    <SelectItem value="stopLoss">Stop Loss</SelectItem>
                    <SelectItem value="trailingStop">Trailing Stop</SelectItem>
                    <SelectItem value="timeExit">Time-based Exit</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="indicators">Indicators</Label>
                <Select defaultValue="macd">
                  <SelectTrigger id="indicators">
                    <SelectValue placeholder="Select indicators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="macd">MACD</SelectItem>
                    <SelectItem value="rsi">RSI</SelectItem>
                    <SelectItem value="bollinger">Bollinger Bands</SelectItem>
                    <SelectItem value="ema">EMA</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fast EMA Period</Label>
              <Slider defaultValue={[12]} max={50} min={5} step={1} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5</span>
                <span>12</span>
                <span>50</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Slow EMA Period</Label>
              <Slider defaultValue={[26]} max={100} min={10} step={1} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10</span>
                <span>26</span>
                <span>100</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="allowLong" defaultChecked />
              <Label htmlFor="allowLong">Allow long positions</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="allowShort" defaultChecked />
              <Label htmlFor="allowShort">Allow short positions</Label>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="risk">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="positionSize">Position Size (%)</Label>
                <Input
                  id="positionSize"
                  type="number"
                  value={positionSize}
                  onChange={(e) => setPositionSize(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxOpenPositions">Max Open Positions</Label>
                <Select defaultValue="1">
                  <SelectTrigger id="maxOpenPositions">
                    <SelectValue placeholder="Select max positions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                <Input id="stopLoss" type="number" step="0.1" defaultValue="2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="takeProfit">Take Profit (%)</Label>
                <Input id="takeProfit" type="number" step="0.1" defaultValue="4" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Risk/Reward Ratio</Label>
              <Slider defaultValue={[2]} max={5} min={1} step={0.1} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1:1</span>
                <span>2:1</span>
                <span>5:1</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDrawdown">Max Drawdown (%)</Label>
              <Input id="maxDrawdown" type="number" step="0.1" defaultValue="10" />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="useTrailingStop" />
              <Label htmlFor="useTrailingStop">Use trailing stop</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="useTimeStop" />
              <Label htmlFor="useTimeStop">Use time-based stop</Label>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}

