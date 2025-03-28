"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    // Calculate next CME opening time (Sunday 6:00 PM ET / 22:00 UTC)
    const calculateTimeToCMEOpening = () => {
      const now = new Date()
      const currentDay = now.getUTCDay() // 0 = Sunday, 1 = Monday, etc.
      const currentHour = now.getUTCHours()

      // Calculate days until next Sunday 22:00 UTC
      let daysUntilSunday = 0

      if (currentDay === 0) {
        // It's Sunday
        if (currentHour >= 22) {
          // After 22:00 UTC, next opening is in 7 days
          daysUntilSunday = 7
        } else {
          // Before 22:00 UTC, opening is today
          daysUntilSunday = 0
        }
      } else {
        // Not Sunday, calculate days until next Sunday
        daysUntilSunday = 7 - currentDay
      }

      // Create date for next Sunday at 22:00 UTC
      const nextOpening = new Date(now.getTime())
      nextOpening.setUTCDate(now.getUTCDate() + daysUntilSunday)
      nextOpening.setUTCHours(22, 0, 0, 0)

      // If it's Sunday before 22:00, set to today at 22:00
      if (currentDay === 0 && currentHour < 22) {
        nextOpening.setUTCDate(now.getUTCDate())
      }

      // Calculate time difference in milliseconds
      const timeDiff = nextOpening.getTime() - now.getTime()

      // Convert to days, hours, minutes, seconds
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

      return { days, hours, minutes, seconds }
    }

    // Update timer every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeToCMEOpening())
    }, 1000)

    // Initial calculation
    setTimeLeft(calculateTimeToCMEOpening())

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <span className="text-3xl font-bold">{timeLeft.days}</span>
            <span className="text-sm text-muted-foreground">Days</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <span className="text-3xl font-bold">{timeLeft.hours}</span>
            <span className="text-sm text-muted-foreground">Hours</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <span className="text-3xl font-bold">{timeLeft.minutes}</span>
            <span className="text-sm text-muted-foreground">Minutes</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <span className="text-3xl font-bold">{timeLeft.seconds}</span>
            <span className="text-sm text-muted-foreground">Seconds</span>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">Upcoming Trading Session</h3>
        <div className="grid gap-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Session Start:</span>
            <span>Sunday 22:00 UTC (CME Futures)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expected Volatility:</span>
            <span className="text-yellow-500">Medium-High</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gap Probability:</span>
            <span>78%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recommended Strategy:</span>
            <span className="font-medium">Wait for first 30m candle</span>
          </div>
        </div>
      </div>
    </div>
  )
}

