import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Try CryptoCompare first
    try {
      const response = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC", {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      })

      if (!response.ok) {
        throw new Error(`CryptoCompare API returned ${response.status}`)
      }

      const data = await response.json()

      if (!data || !data.Data) {
        throw new Error("Invalid data format from CryptoCompare")
      }

      return NextResponse.json({ source: "cryptocompare", data: data.Data })
    } catch (error) {
      console.error("Error fetching from CryptoCompare:", error)

      // Try CoinGecko as fallback
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/news", {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
          next: { revalidate: 300 }, // Cache for 5 minutes
        })

        if (!response.ok) {
          throw new Error(`CoinGecko API returned ${response.status}`)
        }

        const data = await response.json()

        if (!data || !Array.isArray(data)) {
          throw new Error("Invalid data format from CoinGecko")
        }

        return NextResponse.json({ source: "coingecko", data })
      } catch (coinGeckoError) {
        console.error("Error fetching from CoinGecko:", coinGeckoError)
        throw new Error("All news sources failed")
      }
    }
  } catch (error) {
    console.error("Error fetching crypto news:", error)
    return NextResponse.json({ error: "Failed to fetch news data", message: error.message }, { status: 500 })
  }
}

