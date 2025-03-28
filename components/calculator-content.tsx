"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PositionCalculator } from "@/components/position-calculator"
import { fetchTickerData } from "@/lib/binance-api"
import { useState, useEffect } from "react"

export function CalculatorContent() {
  const [currentPrice, setCurrentPrice] = useState(87000)

  // Fetch current price on component mount
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const data = await fetchTickerData()
        if (data && data.lastPrice) {
          setCurrentPrice(Number(data.lastPrice))
        }
      } catch (error) {
        console.error("Failed to fetch current price:", error)
      }
    }

    fetchPrice()
  }, [])

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Position Calculator</h1>
        <p className="text-muted-foreground">Calculate position size, profit/loss, and risk/reward ratio</p>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <PositionCalculator currentPrice={currentPrice} />

        <Card>
          <CardHeader>
            <CardTitle>How to Use the Position Calculator</CardTitle>
            <CardDescription>Guide to effectively using the position calculator</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Basic Usage</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Select position type (Long/Short)</li>
                <li>Enter your capital amount</li>
                <li>Set leverage (higher leverage increases both potential profit and risk)</li>
                <li>Enter entry price, stop loss, and take profit levels</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Risk-Based Sizing</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Enable "Risk-Based Sizing" to calculate position size based on risk percentage</li>
                <li>Set the percentage of your capital you're willing to risk on this trade</li>
                <li>The calculator will determine the appropriate position size based on your stop loss distance</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Tips for Effective Risk Management</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Consider using 1-2% risk per trade as a general guideline</li>
                <li>
                  Aim for a risk/reward ratio of at least 1:2 (potential profit should be at least twice the potential
                  loss)
                </li>
                <li>Place stop losses at logical price levels (support/resistance, swing highs/lows)</li>
                <li>Adjust position size rather than stop loss distance to manage risk</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

