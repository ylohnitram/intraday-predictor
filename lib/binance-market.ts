// Binance Market API client for fetching market data

export interface PerpetualInfo {
  symbol: string
  lastPrice: number
  priceChangePercent: number
  volume: number
  quoteVolume: number
  icon: string
}

// Fetch top perpetuals by volume
export async function fetchTopPerpetuals(limit = 10): Promise<PerpetualInfo[]> {
  try {
    const response = await fetch("https://fapi.binance.com/fapi/v1/ticker/24hr")

    if (!response.ok) {
      throw new Error(`Failed to fetch perpetuals: ${response.statusText}`)
    }

    const data = await response.json()

    // Filter out stablecoins and sort by volume
    const filteredData = data
      .filter(
        (item: any) =>
          item.symbol.endsWith("USDT") &&
          !["USDCUSDT", "BUSDUSDT", "TUSDUSDT", "USDTUSDT", "DAIUSDT"].includes(item.symbol),
      )
      .map((item: any) => ({
        symbol: item.symbol.replace("USDT", ""),
        lastPrice: Number.parseFloat(item.lastPrice),
        priceChangePercent: Number.parseFloat(item.priceChangePercent),
        volume: Number.parseFloat(item.volume),
        quoteVolume: Number.parseFloat(item.quoteVolume),
        icon: getCryptoIcon(item.symbol.replace("USDT", "")),
      }))
      .sort((a: PerpetualInfo, b: PerpetualInfo) => b.quoteVolume - a.quoteVolume)
      .slice(0, limit)

    return filteredData
  } catch (error) {
    console.error("Error fetching top perpetuals:", error)

    // Return fallback data
    return [
      {
        symbol: "BTC",
        lastPrice: 86500,
        priceChangePercent: 1.5,
        volume: 10000,
        quoteVolume: 865000000,
        icon: "bitcoin",
      },
      {
        symbol: "ETH",
        lastPrice: 3500,
        priceChangePercent: 2.1,
        volume: 50000,
        quoteVolume: 175000000,
        icon: "ethereum",
      },
      { symbol: "SOL", lastPrice: 150, priceChangePercent: 3.2, volume: 200000, quoteVolume: 30000000, icon: "solana" },
      { symbol: "BNB", lastPrice: 600, priceChangePercent: 0.8, volume: 30000, quoteVolume: 18000000, icon: "binance" },
      {
        symbol: "XRP",
        lastPrice: 0.5,
        priceChangePercent: -0.5,
        volume: 5000000,
        quoteVolume: 2500000,
        icon: "ripple",
      },
      {
        symbol: "DOGE",
        lastPrice: 0.15,
        priceChangePercent: 1.2,
        volume: 10000000,
        quoteVolume: 1500000,
        icon: "dogecoin",
      },
      {
        symbol: "ADA",
        lastPrice: 0.4,
        priceChangePercent: -0.3,
        volume: 3000000,
        quoteVolume: 1200000,
        icon: "cardano",
      },
      {
        symbol: "AVAX",
        lastPrice: 35,
        priceChangePercent: 2.5,
        volume: 500000,
        quoteVolume: 17500000,
        icon: "avalanche",
      },
      {
        symbol: "DOT",
        lastPrice: 7,
        priceChangePercent: 1.1,
        volume: 2000000,
        quoteVolume: 14000000,
        icon: "polkadot",
      },
      {
        symbol: "MATIC",
        lastPrice: 0.8,
        priceChangePercent: -1.2,
        volume: 4000000,
        quoteVolume: 3200000,
        icon: "polygon",
      },
    ]
  }
}

// Get crypto icon name
function getCryptoIcon(symbol: string): string {
  const iconMap: { [key: string]: string } = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    BNB: "binance",
    XRP: "ripple",
    DOGE: "dogecoin",
    ADA: "cardano",
    AVAX: "avalanche",
    DOT: "polkadot",
    MATIC: "polygon",
    LINK: "chainlink",
    LTC: "litecoin",
    UNI: "uniswap",
    ATOM: "cosmos",
    NEAR: "near",
    FIL: "filecoin",
    AAVE: "aave",
    APE: "apecoin",
    ALGO: "algorand",
    APT: "aptos",
    ARB: "arbitrum",
    BCH: "bitcoincash",
    COMP: "compound",
    CRV: "curve",
    EGLD: "elrond",
    EOS: "eos",
    ETC: "ethereumclassic",
    FTM: "fantom",
    GALA: "gala",
    GRT: "thegraph",
    HBAR: "hedera",
    ICP: "internetcomputer",
    IMX: "immutablex",
    INJ: "injective",
    KAVA: "kava",
    KSM: "kusama",
    MANA: "decentraland",
    MASK: "mask",
    MKR: "maker",
    NEO: "neo",
    OP: "optimism",
    PEPE: "pepe",
    RUNE: "thorchain",
    SAND: "sandbox",
    SHIB: "shiba",
    SNX: "synthetix",
    SUI: "sui",
    TRX: "tron",
    VET: "vechain",
    XLM: "stellar",
    XMR: "monero",
    XTZ: "tezos",
    ZEC: "zcash",
  }

  return iconMap[symbol] || "cryptocurrency"
}

// Fetch Bitcoin dominance from TradingView BTC.D ticker
export async function fetchBitcoinDominance(): Promise<number> {
  try {
    // V reálné aplikaci bychom použili API, které poskytuje data z TradingView BTC.D
    // Pro účely demonstrace použijeme simulovaná data

    // Simulace náhodné hodnoty kolem 58.65%
    const randomOffset = (Math.random() * 2 - 1) * 0.5
    return 58.65 + randomOffset
  } catch (error) {
    console.error("Error fetching BTC dominance:", error)
    return 58.65 // Fallback hodnota
  }
}

