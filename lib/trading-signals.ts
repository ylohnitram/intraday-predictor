import type { CandleData } from "./binance-api"

export interface TradingSignal {
  id: string
  time: string
  timestamp: number
  direction: "up" | "down" | "neutral"
  strength: number
  probability: number
  entry: number
  stopLoss: number
  takeProfit: number
  status: "active" | "pending" | "completed" | "failed"
}

export interface EntryPoint {
  id: string
  time: string
  timestamp: number
  price: number
  direction: "long" | "short"
  stopLoss: number
  takeProfit: number
  riskReward: number
  probability: number
}

// Calculate RSI (Relative Strength Index)
export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) {
    return 50 // Default to neutral if not enough data
  }

  const changes = []
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1])
  }

  let gains = 0
  let losses = 0

  // Calculate initial average gain and loss
  for (let i = 0; i < period; i++) {
    if (changes[i] >= 0) {
      gains += changes[i]
    } else {
      losses += Math.abs(changes[i])
    }
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  // Calculate subsequent average gain and loss values
  for (let i = period; i < changes.length; i++) {
    if (changes[i] >= 0) {
      avgGain = (avgGain * (period - 1) + changes[i]) / period
      avgLoss = (avgLoss * (period - 1)) / period
    } else {
      avgGain = (avgGain * (period - 1)) / period
      avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period
    }
  }

  if (avgLoss === 0) {
    return 100
  }

  const rs = avgGain / avgLoss
  const rsi = 100 - 100 / (1 + rs)

  return rsi
}

// Calculate MACD (Moving Average Convergence Divergence)
export function calculateMACD(
  prices: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): {
  macdLine: number[]
  signalLine: number[]
  histogram: number[]
} {
  // Calculate EMAs
  const fastEMA = calculateEMA(prices, fastPeriod)
  const slowEMA = calculateEMA(prices, slowPeriod)

  // Calculate MACD line
  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i])

  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod)

  // Calculate histogram
  const histogram = macdLine.map((macd, i) => macd - signalLine[i])

  return { macdLine, signalLine, histogram }
}

// Calculate EMA (Exponential Moving Average)
export function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const emaData: number[] = []
  let ema = prices[0]

  for (let i = 0; i < prices.length; i++) {
    const price = prices[i]
    ema = price * k + ema * (1 - k)
    emaData.push(ema)
  }

  return emaData
}

// Calculate Bollinger Bands
export function calculateBollingerBands(
  prices: number[],
  period = 20,
  multiplier = 2,
): {
  upper: number[]
  middle: number[]
  lower: number[]
} {
  const sma = calculateSMA(prices, period)
  const upper: number[] = []
  const lower: number[] = []

  for (let i = period - 1; i < prices.length; i++) {
    // Calculate standard deviation
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += Math.pow(prices[i - j] - sma[i - period + 1], 2)
    }
    const stdDev = Math.sqrt(sum / period)

    upper.push(sma[i - period + 1] + multiplier * stdDev)
    lower.push(sma[i - period + 1] - multiplier * stdDev)
  }

  return {
    upper,
    middle: sma,
    lower,
  }
}

// Calculate SMA (Simple Moving Average)
export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = []

  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += prices[i - j]
    }
    sma.push(sum / period)
  }

  return sma
}

// Generate trading signals based on technical indicators
export function generateTradingSignals(candles: CandleData[], timeframe: string): TradingSignal[] {
  if (candles.length < 50) {
    return []
  }

  const signals: TradingSignal[] = []
  const prices = candles.map((c) => c.close)
  const volumes = candles.map((c) => c.volume)

  // Calculate indicators
  const rsi = calculateRSI(prices)
  const { macdLine, signalLine, histogram } = calculateMACD(prices)
  const { upper, middle, lower } = calculateBollingerBands(prices)

  // Get the most recent candles for signal generation
  const recentCandles = candles.slice(-5)

  // Generate signals based on different strategies

  // 1. RSI Strategy
  if (rsi < 30) {
    // Oversold - potential buy signal
    const latestCandle = candles[candles.length - 1]
    const entryPrice = latestCandle.close
    const stopLoss = entryPrice * 0.99 // 1% stop loss
    const takeProfit = entryPrice * 1.02 // 2% take profit

    signals.push({
      id: `rsi-${Date.now()}`,
      time: formatTime(new Date(latestCandle.time * 1000)),
      timestamp: latestCandle.time * 1000,
      direction: "up",
      strength: Math.round(Math.abs(rsi - 50) * 2), // Convert RSI to strength percentage
      probability: Math.round(70 + Math.random() * 10), // Higher probability for extreme RSI
      entry: entryPrice,
      stopLoss,
      takeProfit,
      status: "active",
    })
  } else if (rsi > 70) {
    // Overbought - potential sell signal
    const latestCandle = candles[candles.length - 1]
    const entryPrice = latestCandle.close
    const stopLoss = entryPrice * 1.01 // 1% stop loss
    const takeProfit = entryPrice * 0.98 // 2% take profit

    signals.push({
      id: `rsi-${Date.now()}`,
      time: formatTime(new Date(latestCandle.time * 1000)),
      timestamp: latestCandle.time * 1000,
      direction: "down",
      strength: Math.round(Math.abs(rsi - 50) * 2), // Convert RSI to strength percentage
      probability: Math.round(70 + Math.random() * 10), // Higher probability for extreme RSI
      entry: entryPrice,
      stopLoss,
      takeProfit,
      status: "active",
    })
  }

  // 2. MACD Strategy
  if (histogram[histogram.length - 1] > 0 && histogram[histogram.length - 2] <= 0) {
    // MACD crossover - potential buy signal
    const latestCandle = candles[candles.length - 1]
    const entryPrice = latestCandle.close
    const stopLoss = entryPrice * 0.99 // 1% stop loss
    const takeProfit = entryPrice * 1.02 // 2% take profit

    signals.push({
      id: `macd-${Date.now()}`,
      time: formatTime(new Date(latestCandle.time * 1000)),
      timestamp: latestCandle.time * 1000,
      direction: "up",
      strength: Math.round(Math.abs((histogram[histogram.length - 1] / prices[prices.length - 1]) * 5000)), // Normalize histogram value
      probability: Math.round(65 + Math.random() * 15),
      entry: entryPrice,
      stopLoss,
      takeProfit,
      status: "pending",
    })
  } else if (histogram[histogram.length - 1] < 0 && histogram[histogram.length - 2] >= 0) {
    // MACD crossover - potential sell signal
    const latestCandle = candles[candles.length - 1]
    const entryPrice = latestCandle.close
    const stopLoss = entryPrice * 1.01 // 1% stop loss
    const takeProfit = entryPrice * 0.98 // 2% take profit

    signals.push({
      id: `macd-${Date.now()}`,
      time: formatTime(new Date(latestCandle.time * 1000)),
      timestamp: latestCandle.time * 1000,
      direction: "down",
      strength: Math.round(Math.abs((histogram[histogram.length - 1] / prices[prices.length - 1]) * 5000)), // Normalize histogram value
      probability: Math.round(65 + Math.random() * 15),
      entry: entryPrice,
      stopLoss,
      takeProfit,
      status: "pending",
    })
  }

  // 3. Bollinger Bands Strategy
  if (prices[prices.length - 1] < lower[lower.length - 1]) {
    // Price below lower band - potential buy signal
    const latestCandle = candles[candles.length - 1]
    const entryPrice = latestCandle.close
    const stopLoss = entryPrice * 0.99 // 1% stop loss
    const takeProfit = middle[middle.length - 1] // Target the middle band

    signals.push({
      id: `bb-${Date.now()}`,
      time: formatTime(new Date(latestCandle.time * 1000)),
      timestamp: latestCandle.time * 1000,
      direction: "up",
      strength: Math.round(
        Math.abs(((prices[prices.length - 1] - lower[lower.length - 1]) / prices[prices.length - 1]) * 100),
      ),
      probability: Math.round(60 + Math.random() * 15),
      entry: entryPrice,
      stopLoss,
      takeProfit,
      status: "active",
    })
  } else if (prices[prices.length - 1] > upper[upper.length - 1]) {
    // Price above upper band - potential sell signal
    const latestCandle = candles[candles.length - 1]
    const entryPrice = latestCandle.close
    const stopLoss = entryPrice * 1.01 // 1% stop loss
    const takeProfit = middle[middle.length - 1] // Target the middle band

    signals.push({
      id: `bb-${Date.now()}`,
      time: formatTime(new Date(latestCandle.time * 1000)),
      timestamp: latestCandle.time * 1000,
      direction: "down",
      strength: Math.round(
        Math.abs(((prices[prices.length - 1] - upper[upper.length - 1]) / prices[prices.length - 1]) * 100),
      ),
      probability: Math.round(60 + Math.random() * 15),
      entry: entryPrice,
      stopLoss,
      takeProfit,
      status: "active",
    })
  }

  // 4. Volume Spike Strategy
  const avgVolume = volumes.slice(-10, -1).reduce((sum, vol) => sum + vol, 0) / 9
  if (volumes[volumes.length - 1] > avgVolume * 1.5) {
    // Volume spike - potential signal based on price action
    const latestCandle = candles[candles.length - 1]
    const prevCandle = candles[candles.length - 2]

    if (latestCandle.close > prevCandle.close) {
      // Bullish volume spike
      const entryPrice = latestCandle.close
      const stopLoss = Math.min(latestCandle.low, prevCandle.low) * 0.99
      const takeProfit = entryPrice * 1.02

      signals.push({
        id: `vol-${Date.now()}`,
        time: formatTime(new Date(latestCandle.time * 1000)),
        timestamp: latestCandle.time * 1000,
        direction: "up",
        strength: Math.round((volumes[volumes.length - 1] / avgVolume) * 30),
        probability: Math.round(55 + Math.random() * 20),
        entry: entryPrice,
        stopLoss,
        takeProfit,
        status: "pending",
      })
    } else if (latestCandle.close < prevCandle.close) {
      // Bearish volume spike
      const entryPrice = latestCandle.close
      const stopLoss = Math.max(latestCandle.high, prevCandle.high) * 1.01
      const takeProfit = entryPrice * 0.98

      signals.push({
        id: `vol-${Date.now()}`,
        time: formatTime(new Date(latestCandle.time * 1000)),
        timestamp: latestCandle.time * 1000,
        direction: "down",
        strength: Math.round((volumes[volumes.length - 1] / avgVolume) * 30),
        probability: Math.round(55 + Math.random() * 20),
        entry: entryPrice,
        stopLoss,
        takeProfit,
        status: "pending",
      })
    }
  }

  // Add a failed signal for demonstration
  if (signals.length > 0 && Math.random() > 0.7) {
    const randomIndex = Math.floor(Math.random() * signals.length)
    const failedSignal = { ...signals[randomIndex] }
    failedSignal.id = `failed-${Date.now()}`
    failedSignal.time = formatTime(new Date(candles[candles.length - 3].time * 1000))
    failedSignal.timestamp = candles[candles.length - 3].time * 1000
    failedSignal.status = "failed"
    signals.push(failedSignal)
  }

  // Add a completed signal for demonstration
  if (signals.length > 0 && Math.random() > 0.7) {
    const randomIndex = Math.floor(Math.random() * signals.length)
    const completedSignal = { ...signals[randomIndex] }
    completedSignal.id = `completed-${Date.now()}`
    completedSignal.time = formatTime(new Date(candles[candles.length - 4].time * 1000))
    completedSignal.timestamp = candles[candles.length - 4].time * 1000
    completedSignal.status = "completed"
    signals.push(completedSignal)
  }

  // Sort signals by timestamp (newest first)
  return signals.sort((a, b) => b.timestamp - a.timestamp)
}

// Generate entry and exit points based on signals
export function generateEntryExitPoints(signals: TradingSignal[]): EntryPoint[] {
  const entryPoints: EntryPoint[] = []

  signals.forEach((signal) => {
    const direction = signal.direction === "up" ? "long" : signal.direction === "down" ? "short" : "long"
    const riskReward =
      direction === "long"
        ? (signal.takeProfit - signal.entry) / (signal.entry - signal.stopLoss)
        : (signal.entry - signal.takeProfit) / (signal.stopLoss - signal.entry)

    entryPoints.push({
      id: `entry-${signal.id}`,
      time: signal.time,
      timestamp: signal.timestamp,
      price: signal.entry,
      direction,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      riskReward: Number(riskReward.toFixed(2)),
      probability: signal.probability,
    })
  })

  // Sort by timestamp (newest first)
  return entryPoints.sort((a, b) => b.timestamp - a.timestamp)
}

// Helper function to format time
function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
}

