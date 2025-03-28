import { type NextRequest, NextResponse } from "next/server"
import { getCachedSupportResistanceLevels, setCachedSupportResistanceLevels, needsRefresh } from "@/lib/redis"
import { defaultSupportResistanceLevels } from "@/lib/background-jobs"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get("symbol") || "BTCUSDT"

  try {
    // Check if we have cached data
    const cachedData = await getCachedSupportResistanceLevels(symbol)

    // Determine if we need to refresh the data
    const shouldRefresh = await needsRefresh("sr_levels", 60 * 60 * 24, { symbol })

    // If we have cached data and it's fresh enough, return it
    if (cachedData && !shouldRefresh) {
      return NextResponse.json(cachedData)
    }

    // For now, we'll use default levels
    // In a real application, these would be calculated based on price action
    await setCachedSupportResistanceLevels(symbol, defaultSupportResistanceLevels)

    return NextResponse.json(defaultSupportResistanceLevels)
  } catch (error) {
    console.error("Error in support-resistance API route:", error)

    // Try to return cached data even if it's stale
    const cachedData = await getCachedSupportResistanceLevels(symbol)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // Return default levels if all else fails
    return NextResponse.json(defaultSupportResistanceLevels)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbol = "BTCUSDT", levels } = await request.json()

    if (!Array.isArray(levels)) {
      return NextResponse.json({ error: "Invalid levels data" }, { status: 400 })
    }

    // Store the new levels
    await setCachedSupportResistanceLevels(symbol, levels)

    return NextResponse.json({ success: true, levels })
  } catch (error) {
    console.error("Error in support-resistance POST route:", error)
    return NextResponse.json({ error: "Failed to update support and resistance levels" }, { status: 500 })
  }
}

