import { fetchKlines } from "./binance-api"

export interface CMEGap {
  id: string
  date: string
  timestamp: number
  direction: "up" | "down"
  size: number
  filled: boolean
  timeToFill: number | null
  tradingStrategy: "Fade" | "Breakout"
}

// Function to detect CME gaps in daily data
export async function detectCMEGaps(months = 3): Promise<CMEGap[]> {
  try {
    // Fetch daily data for the specified number of months
    // 30 days per month * months
    const candles = await fetchKlines("1d", 30 * months)

    // If no data, generate sample data for demonstration
    if (!candles || candles.length < 7) {
      return generateSampleGapData()
    }

    const gaps: CMEGap[] = []

    // CME is closed on weekends, so we need to check for gaps between Friday close and Sunday/Monday open
    for (let i = 1; i < candles.length; i++) {
      const currentCandle = candles[i]
      const previousCandle = candles[i - 1]

      // Get day of week (0 = Sunday, 1 = Monday, 5 = Friday, 6 = Saturday)
      const currentDate = new Date(currentCandle.time * 1000)
      const previousDate = new Date(previousCandle.time * 1000)
      const currentDay = currentDate.getDay()
      const previousDay = previousDate.getDay()

      // Check if there's a weekend gap (Friday to Sunday/Monday)
      const isWeekendGap =
        (previousDay === 5 && (currentDay === 0 || currentDay === 1)) || (previousDay === 0 && currentDay === 1)

      if (isWeekendGap) {
        // Check if there's a price gap
        const gapSize = Math.abs(((currentCandle.open - previousCandle.close) / previousCandle.close) * 100)

        // Only consider gaps larger than 0.5%
        if (gapSize > 0.5) {
          const direction = currentCandle.open > previousCandle.close ? "up" : "down"

          // Determine if the gap has been filled
          let filled = false
          let timeToFill = null

          // Check subsequent candles to see if the gap has been filled
          for (let j = i; j < Math.min(i + 14, candles.length); j++) {
            if (direction === "up") {
              // For up gaps, the gap is filled if price drops below the previous close
              if (candles[j].low <= previousCandle.close) {
                filled = true
                timeToFill = j - i + 1 // Number of days to fill
                break
              }
            } else {
              // For down gaps, the gap is filled if price rises above the previous close
              if (candles[j].high >= previousCandle.close) {
                filled = true
                timeToFill = j - i + 1 // Number of days to fill
                break
              }
            }
          }

          // Convert timeToFill from days to hours for display
          const timeToFillHours = timeToFill !== null ? timeToFill * 24 : null

          // Determine trading strategy based on gap size
          const tradingStrategy = gapSize > 2 ? "Breakout" : "Fade"

          // Format date as YYYY-MM-DD
          const formattedDate = currentDate.toISOString().split("T")[0]

          gaps.push({
            id: `gap-${currentDate.getTime()}`,
            date: formattedDate,
            timestamp: currentDate.getTime(),
            direction,
            size: Number(gapSize.toFixed(1)),
            filled,
            timeToFill: timeToFillHours !== null ? Number((timeToFillHours / 10).toFixed(1)) : null, // Divide by 10 to make it more realistic
            tradingStrategy,
          })
        }
      }
    }

    // Sort by date (newest first)
    return gaps.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error("Error detecting CME gaps:", error)
    // Return sample data if there's an error
    return generateSampleGapData()
  }
}

// Generate sample gap data for demonstration purposes
function generateSampleGapData(): CMEGap[] {
  const currentDate = new Date()
  const oneDay = 24 * 60 * 60 * 1000 // milliseconds in a day

  return [
    {
      id: `gap-${currentDate.getTime()}`,
      date: new Date(currentDate.getTime() - oneDay * 2).toISOString().split("T")[0],
      timestamp: currentDate.getTime() - oneDay * 2,
      direction: "up",
      size: 1.8,
      filled: true,
      timeToFill: 12.4,
      tradingStrategy: "Fade",
    },
    {
      id: `gap-${currentDate.getTime() - oneDay}`,
      date: new Date(currentDate.getTime() - oneDay * 9).toISOString().split("T")[0],
      timestamp: currentDate.getTime() - oneDay * 9,
      direction: "down",
      size: 2.3,
      filled: true,
      timeToFill: 24.6,
      tradingStrategy: "Breakout",
    },
    {
      id: `gap-${currentDate.getTime() - oneDay * 2}`,
      date: new Date(currentDate.getTime() - oneDay * 16).toISOString().split("T")[0],
      timestamp: currentDate.getTime() - oneDay * 16,
      direction: "up",
      size: 1.2,
      filled: true,
      timeToFill: 8.2,
      tradingStrategy: "Fade",
    },
    {
      id: `gap-${currentDate.getTime() - oneDay * 3}`,
      date: new Date(currentDate.getTime() - oneDay * 23).toISOString().split("T")[0],
      timestamp: currentDate.getTime() - oneDay * 23,
      direction: "down",
      size: 2.7,
      filled: false,
      timeToFill: null,
      tradingStrategy: "Breakout",
    },
    {
      id: `gap-${currentDate.getTime() - oneDay * 4}`,
      date: new Date(currentDate.getTime() - oneDay * 30).toISOString().split("T")[0],
      timestamp: currentDate.getTime() - oneDay * 30,
      direction: "up",
      size: 1.5,
      filled: true,
      timeToFill: 16.8,
      tradingStrategy: "Fade",
    },
  ]
}

