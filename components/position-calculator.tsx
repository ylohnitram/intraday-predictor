"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Calculator, ExternalLink } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSearchParams } from "next/navigation"

interface PositionCalculatorProps {
  currentPrice: number
}

export function PositionCalculator({ currentPrice }: PositionCalculatorProps) {
  // State variables
  const [capital, setCapital] = useState(1000)
  const [leverage, setLeverage] = useState(1)
  const [entryPrice, setEntryPrice] = useState(currentPrice)
  const [entryPriceInput, setEntryPriceInput] = useState(currentPrice.toString())
  const [stopLossPrice, setStopLossPrice] = useState(currentPrice * 0.98)
  const [takeProfitPrice, setTakeProfitPrice] = useState(currentPrice * 1.03)
  const [stopLossPercent, setStopLossPercent] = useState(2)
  const [takeProfitPercent, setTakeProfitPercent] = useState(3)
  const [usePercentages, setUsePercentages] = useState(true)
  const [riskPercent, setRiskPercent] = useState(1) // Default to 1% risk
  const [useRiskPercent, setUseRiskPercent] = useState(false)
  const [tradingFee, setTradingFee] = useState(0.08) // 0.08% trading fee (0.04% entry + 0.04% exit)
  const [symbol, setSymbol] = useState("BTC")

  // Auto-detected position type
  const [positionType, setPositionType] = useState<"long" | "short" | "neutral">("neutral")

  // Calculated values
  const [positionSize, setPositionSize] = useState(0)
  const [marginRequired, setMarginRequired] = useState(0)
  const [potentialProfit, setPotentialProfit] = useState(0)
  const [potentialLoss, setPotentialLoss] = useState(0)
  const [riskRewardRatio, setRiskRewardRatio] = useState(0)
  const [totalFees, setTotalFees] = useState(0)

  // Ref for Entry Price Input
  const entryPriceInputRef = useRef<HTMLInputElement>(null)

  // Get search params for pre-filled values
  const searchParams = useSearchParams()

  // Handle focus on Entry Price input
  const handleEntryPriceFocus = () => {
    if (entryPriceInputRef.current) {
      entryPriceInputRef.current.select()
    }
  }

  // Update entry price when current price changes (only on initial load)
  useEffect(() => {
    // Only update if the entry price hasn't been manually set yet
    if (!entryPriceInput || entryPriceInput === "0") {
      setEntryPrice(currentPrice)
      setEntryPriceInput(currentPrice.toString())
    }
  }, [currentPrice])

  // Check for query parameters and set values
  useEffect(() => {
    if (searchParams) {
      const entryParam = searchParams.get("entryPrice")
      const stopLossParam = searchParams.get("stopLoss")
      const takeProfitParam = searchParams.get("takeProfit")
      const positionTypeParam = searchParams.get("positionType")

      if (entryParam) {
        const entryValue = Number.parseFloat(entryParam)
        if (!isNaN(entryValue)) {
          setEntryPrice(entryValue)
          setEntryPriceInput(entryValue.toString())
        }
      }

      if (stopLossParam) {
        const stopLossValue = Number.parseFloat(stopLossParam)
        if (!isNaN(stopLossValue)) {
          setStopLossPrice(stopLossValue)
          setUsePercentages(false)
        }
      }

      if (takeProfitParam) {
        const takeProfitValue = Number.parseFloat(takeProfitParam)
        if (!isNaN(takeProfitValue)) {
          setTakeProfitPrice(takeProfitValue)
          setUsePercentages(false)
        }
      }

      if (positionTypeParam === "long" || positionTypeParam === "short") {
        setPositionType(positionTypeParam)
      }
    }
  }, [searchParams])

  // Determine position type based on entry, SL, and TP
  useEffect(() => {
    if (entryPrice > stopLossPrice && takeProfitPrice > entryPrice) {
      setPositionType("long")
    } else if (entryPrice < stopLossPrice && takeProfitPrice < entryPrice) {
      setPositionType("short")
    } else {
      setPositionType("neutral")
    }
  }, [entryPrice, stopLossPrice, takeProfitPrice])

  // Calculate position metrics
  useEffect(() => {
    // Don't calculate position size here if using risk-based sizing
    if (!useRiskPercent) {
      setPositionSize(capital * leverage)
    }

    // Calculate margin required
    setMarginRequired(positionSize / leverage)

    // Calculate potential profit and loss including trading fees
    let profit = 0
    let loss = 0
    let fees = 0

    if (positionType === "long") {
      // Calculate fees (entry and exit)
      fees = positionSize * (tradingFee / 100) * 2

      // Calculate profit/loss
      profit = positionSize * ((takeProfitPrice - entryPrice) / entryPrice) - fees
      loss = positionSize * ((entryPrice - stopLossPrice) / entryPrice) + fees
    } else if (positionType === "short") {
      // Calculate fees (entry and exit)
      fees = positionSize * (tradingFee / 100) * 2

      // Calculate profit/loss
      profit = positionSize * ((entryPrice - takeProfitPrice) / entryPrice) - fees
      loss = positionSize * ((stopLossPrice - entryPrice) / entryPrice) + fees
    } else {
      // Neutral position - no calculations
      profit = 0
      loss = 0
      fees = 0
    }

    setPotentialProfit(profit)
    setPotentialLoss(loss)
    setTotalFees(fees)

    // Calculate risk/reward ratio
    setRiskRewardRatio(loss > 0 ? profit / loss : 0)
  }, [
    capital,
    leverage,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    positionType,
    positionSize,
    useRiskPercent,
    tradingFee,
  ])

  // Calculate position size based on risk percentage
  useEffect(() => {
    if (useRiskPercent) {
      // Calculate the risk amount based on capital and risk percentage
      const riskAmount = capital * (riskPercent / 100)

      // Calculate the price difference for stop loss
      let priceDifference = 0
      if (positionType === "long") {
        priceDifference = entryPrice - stopLossPrice
      } else if (positionType === "short") {
        priceDifference = stopLossPrice - entryPrice
      }

      // Calculate position size based on risk, including trading fees
      if (priceDifference > 0) {
        // Include trading fees in the risk calculation
        const feePercentage = tradingFee / 100
        const totalFeeImpact = feePercentage * 2 // Entry and exit fees

        // Adjust risk to account for fees
        const adjustedRisk = riskAmount / (1 + totalFeeImpact)

        // Calculate position size
        const riskBasedSize = adjustedRisk / (priceDifference / entryPrice)
        setPositionSize(riskBasedSize)
      }
    }
  }, [riskPercent, stopLossPrice, entryPrice, positionType, capital, useRiskPercent, tradingFee])

  // Update stop loss and take profit prices when percentages change
  useEffect(() => {
    if (usePercentages) {
      if (positionType === "long") {
        setStopLossPrice(entryPrice * (1 - stopLossPercent / 100))
        setTakeProfitPrice(entryPrice * (1 + takeProfitPercent / 100))
      } else if (positionType === "short") {
        setStopLossPrice(entryPrice * (1 + stopLossPercent / 100))
        setTakeProfitPrice(entryPrice * (1 - takeProfitPercent / 100))
      }
    }
  }, [stopLossPercent, takeProfitPercent, entryPrice, positionType, usePercentages])

  // Update percentages when prices change
  useEffect(() => {
    if (!usePercentages) {
      if (positionType === "long") {
        setStopLossPercent(((entryPrice - stopLossPrice) / entryPrice) * 100)
        setTakeProfitPercent(((takeProfitPrice - entryPrice) / entryPrice) * 100)
      } else if (positionType === "short") {
        setStopLossPercent(((stopLossPrice - entryPrice) / entryPrice) * 100)
        setTakeProfitPercent(((entryPrice - takeProfitPrice) / entryPrice) * 100)
      }
    }
  }, [stopLossPrice, takeProfitPrice, entryPrice, positionType, usePercentages])

  // Handle entry price input change - FIXED VERSION
  const handleEntryPriceChange = (value: string) => {
    // Allow any input, including empty string
    setEntryPriceInput(value)

    // Only update the actual entry price if the value is a valid number
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue)) {
      setEntryPrice(numValue)
    } else if (value === "") {
      // If field is cleared, set entry price to 0
      setEntryPrice(0)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Position Calculator
          </CardTitle>
        </div>
        <CardDescription>Calculate position size, profit/loss, and risk/reward ratio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant={positionType === "long" ? "default" : "outline"}
              className={positionType === "long" ? "bg-green-500 hover:bg-green-600 cursor-default" : "cursor-default"}
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              Long
            </Badge>
            <Badge
              variant={positionType === "short" ? "destructive" : "outline"}
              className={positionType === "short" ? "cursor-default" : "cursor-default"}
            >
              <ArrowDown className="h-3 w-3 mr-1" />
              Short
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>Use %</span>
            <Switch checked={usePercentages} onCheckedChange={setUsePercentages} size="sm" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="capital">Capital ($)</Label>
            <Input
              id="capital"
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              min={1}
              disabled={useRiskPercent}
              className={useRiskPercent ? "opacity-50" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leverage">Leverage (x)</Label>
            <Input
              id="leverage"
              type="number"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              min={1}
              max={100}
              step={1}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="entryPrice">Entry Price ($)</Label>
            <Input
              id="entryPrice"
              ref={entryPriceInputRef}
              type="text"
              inputMode="decimal"
              value={entryPriceInput}
              onChange={(e) => handleEntryPriceChange(e.target.value)}
              onFocus={handleEntryPriceFocus}
              className="border-primary focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="BTC, ETH, etc."
            />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="riskToggle">Risk-Based Sizing</Label>
            <Switch id="riskToggle" checked={useRiskPercent} onCheckedChange={setUseRiskPercent} />
          </div>

          {useRiskPercent && (
            <div className="space-y-2">
              <Label htmlFor="riskPercent">Risk Percentage (%)</Label>
              <Input
                id="riskPercent"
                type="number"
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value))}
                min={0.1}
                max={5}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Risk ${((capital * riskPercent) / 100).toFixed(2)} of capital
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tradingFee">Trading Fee (%)</Label>
          <Input
            id="tradingFee"
            type="number"
            value={tradingFee}
            onChange={(e) => setTradingFee(Number(e.target.value))}
            min={0}
            max={1}
            step={0.01}
          />
          <p className="text-xs text-muted-foreground">Fee applied to both entry and exit (round trip)</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stopLoss" className="text-red-500">
              Stop Loss {usePercentages ? `(${stopLossPercent.toFixed(2)}%)` : "($)"}
            </Label>
            {usePercentages ? (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="stopLossPercent"
                  type="number"
                  value={stopLossPercent}
                  onChange={(e) => setStopLossPercent(Number(e.target.value))}
                  min={0.1}
                  max={20}
                  step={0.1}
                />
                <Input
                  id="stopLossPrice"
                  type="number"
                  value={stopLossPrice}
                  onChange={(e) => {
                    setStopLossPrice(Number(e.target.value))
                    setUsePercentages(false)
                  }}
                  min={0.01}
                  step="any"
                  className="border-red-200 focus-visible:ring-red-500"
                />
              </div>
            ) : (
              <Input
                id="stopLoss"
                type="number"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(Number(e.target.value))}
                min={0.01}
                step="any"
                className="border-red-200 focus-visible:ring-red-500"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="takeProfit" className="text-green-500">
              Take Profit {usePercentages ? `(${takeProfitPercent.toFixed(2)}%)` : "($)"}
            </Label>
            {usePercentages ? (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="takeProfitPercent"
                  type="number"
                  value={takeProfitPercent}
                  onChange={(e) => setTakeProfitPercent(Number(e.target.value))}
                  min={0.1}
                  max={20}
                  step={0.1}
                />
                <Input
                  id="takeProfitPrice"
                  type="number"
                  value={takeProfitPrice}
                  onChange={(e) => {
                    setTakeProfitPrice(Number(e.target.value))
                    setUsePercentages(false)
                  }}
                  min={0.01}
                  step="any"
                  className="border-green-200 focus-visible:ring-green-500"
                />
              </div>
            ) : (
              <Input
                id="takeProfit"
                type="number"
                value={takeProfitPrice}
                onChange={(e) => setTakeProfitPrice(Number(e.target.value))}
                min={0.01}
                step="any"
                className="border-green-200 focus-visible:ring-green-500"
              />
            )}
          </div>
        </div>

        <div className="mt-4 rounded-md border p-3 bg-muted/30">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Position Size:</span>
              <span className="font-medium">${positionSize.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="text-sm text-muted-foreground underline decoration-dotted">
                    Margin Required:
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Amount to enter in Binance.com for this trade</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="font-medium">${marginRequired.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Risk/Reward:</span>
              <span className={`font-medium ${riskRewardRatio >= 2 ? "text-green-500" : ""}`}>
                1:{riskRewardRatio.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Trading Fees:</span>
              <span className="font-medium text-muted-foreground">${totalFees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Potential Profit:</span>
              <span className="font-medium text-green-500">+${potentialProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Potential Loss:</span>
              <span className="font-medium text-red-500">-${potentialLoss.toFixed(2)}</span>
            </div>
          </div>
          {useRiskPercent && (
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Risk-Based Position:</span>
              <span>
                {riskPercent}% of ${capital.toFixed(2)} = ${((capital * riskPercent) / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
          <p className="flex items-center gap-1">
            Calculations for trading on Binance.com
            <a
              href="https://www.binance.com/referral/earn-together/refertoearn2000usdc/claim?hl=en&ref=GRO_14352_UIYSL"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center hover:underline"
            >
              Sign up with referral <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

