// Data pro Sunday-Monday analýzu

export interface SundayMondayData {
  date: string
  sundayClose: number
  mondayOpen: number
  mondayClose: number
  gapPercent: number
  gapDirection: "up" | "down" | "none"
  gapFilled: boolean
  timeToFillGap?: string
}

export interface CMEGapData {
  startDate: string
  endDate: string
  gapOpenPrice: number
  gapClosePrice: number
  gapSize: number
  gapDirection: "up" | "down"
  filled: boolean
  timeToFill?: string
  probability: number
}

export interface SundayMondayStats {
  totalWeeks: number
  gapUpCount: number
  gapDownCount: number
  noGapCount: number
  gapUpAvgSize: number
  gapDownAvgSize: number
  gapFilledCount: number
  gapFilledPercent: number
  avgTimeToFillGap: string
  gapUpFilledPercent: number
  gapDownFilledPercent: number
}

// Fetch Sunday-Monday data for the last year
export async function fetchSundayMondayData(): Promise<SundayMondayData[]> {
  try {
    // V reálné aplikaci bychom použili API pro získání historických dat
    // Pro účely demonstrace použijeme simulovaná data

    const currentDate = new Date()
    const data: SundayMondayData[] = []

    // Generujeme data pro posledních 52 týdnů (1 rok)
    for (let i = 0; i < 52; i++) {
      const weekDate = new Date(currentDate)
      weekDate.setDate(currentDate.getDate() - i * 7)

      // Najdeme neděli a pondělí pro daný týden
      const sunday = new Date(weekDate)
      sunday.setDate(weekDate.getDate() - weekDate.getDay())

      const monday = new Date(sunday)
      monday.setDate(sunday.getDate() + 1)

      // Generujeme náhodné ceny
      const basePrice = 50000 - i * 200 + Math.random() * 5000
      const sundayClose = basePrice

      // Generujeme gap (mezeru) mezi nedělním zavřením a pondělním otevřením
      const gapPercent = Math.random() * 4 - 2 // -2% až +2%
      const mondayOpen = sundayClose * (1 + gapPercent / 100)

      // Generujeme pondělní zavírací cenu
      const mondayMove = Math.random() * 3 - 1 // -1% až +2%
      const mondayClose = mondayOpen * (1 + mondayMove / 100)

      // Určíme směr gapu
      const gapDirection: "up" | "down" | "none" = gapPercent > 0.1 ? "up" : gapPercent < -0.1 ? "down" : "none"

      // Určíme, zda byl gap vyplněn
      const gapFilled = Math.random() > 0.3 // 70% šance na vyplnění gapu

      // Čas potřebný k vyplnění gapu (pokud byl vyplněn)
      const timeToFillGap = gapFilled
        ? `${Math.floor(Math.random() * 5) + 1}d ${Math.floor(Math.random() * 12) + 1}h`
        : undefined

      data.push({
        date: sunday.toISOString().split("T")[0],
        sundayClose,
        mondayOpen,
        mondayClose,
        gapPercent,
        gapDirection,
        gapFilled,
        timeToFillGap,
      })
    }

    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error("Error fetching Sunday-Monday data:", error)
    return []
  }
}

// Fetch CME gap data
export async function fetchCMEGapData(): Promise<CMEGapData[]> {
  try {
    // V reálné aplikaci bychom použili API pro získání dat o CME gapech
    // Pro účely demonstrace použijeme simulovaná data

    const currentDate = new Date()
    const data: CMEGapData[] = []

    // Generujeme data pro posledních 20 CME gapů
    for (let i = 0; i < 20; i++) {
      const weekDate = new Date(currentDate)
      weekDate.setDate(currentDate.getDate() - i * 7)

      // Najdeme pátek a pondělí pro daný víkend
      const friday = new Date(weekDate)
      friday.setDate(weekDate.getDate() - ((weekDate.getDay() + 2) % 7))

      const monday = new Date(friday)
      monday.setDate(friday.getDate() + 3)

      // Generujeme náhodné ceny
      const basePrice = 50000 - i * 200 + Math.random() * 5000
      const fridayClose = basePrice

      // Generujeme gap (mezeru) mezi pátečním zavřením a pondělním otevřením
      const gapSize = Math.random() * 5 - 2.5 // -2.5% až +2.5%
      const mondayOpen = fridayClose * (1 + gapSize / 100)

      // Určíme směr gapu
      const gapDirection: "up" | "down" = gapSize > 0 ? "up" : "down"

      // Určíme, zda byl gap vyplněn
      const filled = Math.random() > 0.2 // 80% šance na vyplnění gapu

      // Čas potřebný k vyplnění gapu (pokud byl vyplněn)
      const timeToFill = filled ? `${Math.floor(Math.random() * 14) + 1}d` : undefined

      // Pravděpodobnost vyplnění gapu
      const probability = Math.min(95, Math.max(50, 75 + Math.abs(gapSize) * 5))

      data.push({
        startDate: friday.toISOString().split("T")[0],
        endDate: monday.toISOString().split("T")[0],
        gapOpenPrice: fridayClose,
        gapClosePrice: mondayOpen,
        gapSize: Math.abs(gapSize),
        gapDirection,
        filled,
        timeToFill,
        probability,
      })
    }

    return data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  } catch (error) {
    console.error("Error fetching CME gap data:", error)
    return []
  }
}

// Calculate Sunday-Monday statistics
export function calculateSundayMondayStats(data: SundayMondayData[]): SundayMondayStats {
  if (!data || data.length === 0) {
    return {
      totalWeeks: 0,
      gapUpCount: 0,
      gapDownCount: 0,
      noGapCount: 0,
      gapUpAvgSize: 0,
      gapDownAvgSize: 0,
      gapFilledCount: 0,
      gapFilledPercent: 0,
      avgTimeToFillGap: "N/A",
      gapUpFilledPercent: 0,
      gapDownFilledPercent: 0,
    }
  }

  const totalWeeks = data.length
  const gapUpData = data.filter((d) => d.gapDirection === "up")
  const gapDownData = data.filter((d) => d.gapDirection === "down")
  const noGapData = data.filter((d) => d.gapDirection === "none")

  const gapUpCount = gapUpData.length
  const gapDownCount = gapDownData.length
  const noGapCount = noGapData.length

  const gapUpAvgSize = gapUpData.length > 0 ? gapUpData.reduce((sum, d) => sum + d.gapPercent, 0) / gapUpCount : 0

  const gapDownAvgSize =
    gapDownData.length > 0 ? Math.abs(gapDownData.reduce((sum, d) => sum + d.gapPercent, 0) / gapDownCount) : 0

  const gapFilledData = data.filter((d) => d.gapFilled)
  const gapFilledCount = gapFilledData.length
  const gapFilledPercent = (gapFilledCount / (gapUpCount + gapDownCount)) * 100

  const gapUpFilledCount = gapUpData.filter((d) => d.gapFilled).length
  const gapDownFilledCount = gapDownData.filter((d) => d.gapFilled).length

  const gapUpFilledPercent = gapUpCount > 0 ? (gapUpFilledCount / gapUpCount) * 100 : 0
  const gapDownFilledPercent = gapDownCount > 0 ? (gapDownFilledCount / gapDownCount) * 100 : 0

  // Calculate average time to fill gap
  const timeToFillData = gapFilledData.filter((d) => d.timeToFillGap)

  let avgTimeToFillGap = "N/A"
  if (timeToFillData.length > 0) {
    // Simplified calculation for demonstration
    avgTimeToFillGap = `${Math.round(timeToFillData.length / 2)}d 12h`
  }

  return {
    totalWeeks,
    gapUpCount,
    gapDownCount,
    noGapCount,
    gapUpAvgSize,
    gapDownAvgSize,
    gapFilledCount,
    gapFilledPercent,
    avgTimeToFillGap,
    gapUpFilledPercent,
    gapDownFilledPercent,
  }
}

