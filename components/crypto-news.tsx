"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, RefreshCw, Calendar, Tag, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

interface NewsItem {
  id: string
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  category: "bullish" | "bearish" | "neutral"
  tags: string[]
  slug: string
}

export function CryptoNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeCategory, setActiveCategory] = useState("all")
  const [featuredNews, setFeaturedNews] = useState<NewsItem | null>(null)

  useEffect(() => {
    fetchNews()
    // Refresh every 15 minutes
    const interval = setInterval(fetchNews, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchNews = async () => {
    try {
      setLoading(true)
      setError(null)

      // Add a timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      // Use our server-side API route instead of directly calling external APIs
      const response = await fetch("/api/crypto-news", {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      }).finally(() => clearTimeout(timeoutId))

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const { source, data, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      let newsItems: NewsItem[] = []

      if (source === "cryptocompare") {
        // Transform CryptoCompare data
        newsItems = data.map((item: any, index: number) => {
          // Simple sentiment analysis based on title and body
          let category: "bullish" | "bearish" | "neutral" = "neutral"
          const bullishTerms = [
            "bull",
            "surge",
            "soar",
            "rise",
            "gain",
            "rally",
            "jump",
            "high",
            "up",
            "positive",
            "growth",
            "optimistic",
            "breakthrough",
          ]
          const bearishTerms = [
            "bear",
            "drop",
            "fall",
            "crash",
            "plunge",
            "down",
            "low",
            "loss",
            "sell",
            "negative",
            "decline",
            "pessimistic",
            "concern",
          ]

          const combinedText = (item.title + " " + (item.body || "")).toLowerCase()

          const bullishCount = bullishTerms.filter((term) => combinedText.includes(term)).length
          const bearishCount = bearishTerms.filter((term) => combinedText.includes(term)).length

          if (bullishCount > bearishCount) {
            category = "bullish"
          } else if (bearishCount > bullishCount) {
            category = "bearish"
          }

          // Generate tags from title and categories
          const tags = generateTags(item.title, item.categories ? item.categories.split("|") : ["BTC"])

          // Generate SEO-friendly slug
          const slug = generateSlug(item.title)

          return {
            id: item.id || `news-${index}`,
            title: item.title,
            description: item.body ? item.body.substring(0, 150) + "..." : item.title,
            url: item.url,
            source: item.source,
            publishedAt: item.published_on
              ? new Date(item.published_on * 1000).toISOString()
              : new Date().toISOString(),
            category,
            tags,
            slug,
          }
        })
      } else if (source === "coingecko") {
        // Transform CoinGecko data
        newsItems = data.map((item: any, index: number) => {
          // Simple sentiment analysis based on title
          let category: "bullish" | "bearish" | "neutral" = "neutral"
          const bullishTerms = [
            "bull",
            "surge",
            "soar",
            "rise",
            "gain",
            "rally",
            "jump",
            "high",
            "up",
            "positive",
            "growth",
            "optimistic",
            "breakthrough",
          ]
          const bearishTerms = [
            "bear",
            "drop",
            "fall",
            "crash",
            "plunge",
            "down",
            "low",
            "loss",
            "sell",
            "negative",
            "decline",
            "pessimistic",
            "concern",
          ]

          const title = item.title.toLowerCase()
          if (bullishTerms.some((term) => title.includes(term))) {
            category = "bullish"
          } else if (bearishTerms.some((term) => title.includes(term))) {
            category = "bearish"
          }

          // Generate tags from title
          const tags = generateTags(item.title, ["BTC", "cryptocurrency"])

          // Generate SEO-friendly slug
          const slug = generateSlug(item.title)

          return {
            id: item.id || `news-${index}`,
            title: item.title,
            description: item.description || item.title,
            url: item.url,
            source: item.author || "CoinGecko",
            publishedAt: item.created_at || new Date().toISOString(),
            category,
            tags,
            slug,
          }
        })
      }

      if (newsItems.length === 0) {
        throw new Error("No news items found")
      }

      // Set featured news (most recent bullish or bearish news)
      const potentialFeatured = newsItems.find((item) => item.category !== "neutral") || newsItems[0]
      setFeaturedNews(potentialFeatured)

      setNews(newsItems)
    } catch (err) {
      console.error("Error fetching news:", err)

      // Use static fallback news data if all APIs fail
      const fallbackNews = generateFallbackNews()
      setNews(fallbackNews)
      setFeaturedNews(fallbackNews[0])
      setError("Using cached news data. Live updates unavailable.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Generate fallback news data
  const generateFallbackNews = (): NewsItem[] => {
    const currentDate = new Date()

    return [
      {
        id: "fallback-1",
        title: "Bitcoin Approaches Key Resistance Level as Market Sentiment Improves",
        description:
          "Bitcoin is testing a critical resistance zone as on-chain metrics show accumulation by long-term holders. Analysts suggest a breakout could lead to significant upside momentum.",
        url: "https://www.tradingview.com/chart/?symbol=BITSTAMP%3ABTCUSD",
        source: "BTC Intraday Predictor",
        publishedAt: new Date(currentDate.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        category: "bullish",
        tags: ["bitcoin", "btc", "resistance", "technical analysis", "accumulation"],
        slug: "bitcoin-approaches-key-resistance-level-as-market-sentiment-improves",
      },
      {
        id: "fallback-2",
        title: "Market Analysis: Bitcoin Volatility Decreases as Trading Volume Stabilizes",
        description:
          "Bitcoin's 30-day volatility has reached a 3-month low as trading volumes stabilize. This period of consolidation often precedes significant price movements.",
        url: "https://www.tradingview.com/chart/?symbol=BITSTAMP%3ABTCUSD",
        source: "BTC Intraday Predictor",
        publishedAt: new Date(currentDate.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        category: "neutral",
        tags: ["bitcoin", "btc", "volatility", "trading volume", "consolidation"],
        slug: "market-analysis-bitcoin-volatility-decreases-as-trading-volume-stabilizes",
      },
      {
        id: "fallback-3",
        title: "Bitcoin Forms Bearish Pattern on Daily Chart, Traders Cautious",
        description:
          "Technical analysts point to a potential bearish pattern forming on Bitcoin's daily chart. Key support levels to watch as traders adopt a more cautious stance.",
        url: "https://www.tradingview.com/chart/?symbol=BITSTAMP%3ABTCUSD",
        source: "BTC Intraday Predictor",
        publishedAt: new Date(currentDate.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        category: "bearish",
        tags: ["bitcoin", "btc", "bearish pattern", "technical analysis", "support levels"],
        slug: "bitcoin-forms-bearish-pattern-on-daily-chart-traders-cautious",
      },
      {
        id: "fallback-4",
        title: "On-Chain Analysis: Bitcoin Accumulation Trend Strengthens Despite Price Action",
        description:
          "On-chain metrics reveal increasing accumulation by long-term holders despite recent price volatility. This divergence between price and holder behavior could signal a potential trend reversal.",
        url: "https://www.tradingview.com/chart/?symbol=BITSTAMP%3ABTCUSD",
        source: "BTC Intraday Predictor",
        publishedAt: new Date(currentDate.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        category: "bullish",
        tags: ["bitcoin", "btc", "on-chain analysis", "accumulation", "long-term holders"],
        slug: "on-chain-analysis-bitcoin-accumulation-trend-strengthens-despite-price-action",
      },
      {
        id: "fallback-5",
        title: "Bitcoin's Correlation with Traditional Markets Reaches New Low",
        description:
          "Bitcoin's correlation with the S&P 500 has decreased significantly, suggesting potential for independent price action. This decoupling could be positive for crypto markets seeking differentiation as an asset class.",
        url: "https://www.tradingview.com/chart/?symbol=BITSTAMP%3ABTCUSD",
        source: "BTC Intraday Predictor",
        publishedAt: new Date(currentDate.getTime() - 16 * 60 * 60 * 1000).toISOString(),
        category: "bullish",
        tags: ["bitcoin", "btc", "correlation", "traditional markets", "decoupling"],
        slug: "bitcoins-correlation-with-traditional-markets-reaches-new-low",
      },
      {
        id: "fallback-6",
        title: "Weekend Trading Strategy: Preparing for Sunday-Monday Bitcoin Volatility",
        description:
          "Historical analysis shows increased Bitcoin volatility during Sunday-Monday transitions. This article explores strategies to capitalize on these recurring patterns.",
        url: "https://www.tradingview.com/chart/?symbol=BITSTAMP%3ABTCUSD",
        source: "BTC Intraday Predictor",
        publishedAt: new Date(currentDate.getTime() - 20 * 60 * 60 * 1000).toISOString(),
        category: "neutral",
        tags: ["bitcoin", "btc", "weekend trading", "volatility", "sunday-monday"],
        slug: "weekend-trading-strategy-preparing-for-sunday-monday-bitcoin-volatility",
      },
      {
        id: "fallback-7",
        title: "Bitcoin Support Zones Hold Strong as Bulls Defend Key Levels",
        description:
          "Bitcoin bulls have successfully defended important support zones, preventing further downside. Technical analysis suggests potential for a bounce if these levels continue to hold.",
        url: "https://www.tradingview.com/chart/?symbol=BITSTAMP%3ABTCUSD",
        source: "BTC Intraday Predictor",
        publishedAt: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        category: "bullish",
        tags: ["bitcoin", "btc", "support zones", "technical analysis", "bullish defense"],
        slug: "bitcoin-support-zones-hold-strong-as-bulls-defend-key-levels",
      },
    ]
  }

  // Generate SEO-friendly tags from title and currencies
  const generateTags = (title: string, currencies: string[]): string[] => {
    const commonTags = ["cryptocurrency", "crypto", "bitcoin", "blockchain", "trading"]
    const titleWords = title.toLowerCase().split(/\s+/)

    // Extract potential keywords from title
    const keywordRegex =
      /\b(bitcoin|btc|ethereum|eth|crypto|blockchain|defi|nft|altcoin|trading|market|price|analysis|regulation)\w*\b/gi
    const titleTags = title.match(keywordRegex) || []

    // Combine all tags and remove duplicates
    const allTags = [
      ...new Set([
        ...commonTags,
        ...currencies.map((c) => c.toLowerCase()),
        ...titleTags.map((tag) => tag.toLowerCase()),
      ]),
    ]

    // Limit to 10 tags
    return allTags.slice(0, 10)
  }

  // Generate SEO-friendly slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .substring(0, 100) // Limit length
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchNews()
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return `${diffSecs}s ago`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getCategoryBadge = (category: "bullish" | "bearish" | "neutral") => {
    switch (category) {
      case "bullish":
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Bullish
          </Badge>
        )
      case "bearish":
        return (
          <Badge className="bg-red-500 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> Bearish
          </Badge>
        )
      case "neutral":
        return (
          <Badge className="bg-yellow-500 flex items-center gap-1">
            <Minus className="h-3 w-3" /> Neutral
          </Badge>
        )
    }
  }

  const filteredNews = activeCategory === "all" ? news : news.filter((item) => item.category === activeCategory)

  return (
    <Card className="crypto-news-container">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Crypto Market News</CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-8">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        <CardDescription>Latest news affecting crypto markets</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && news.length === 0 ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-[150px] w-full" />
              <Skeleton className="h-[150px] w-full" />
              <Skeleton className="h-[150px] w-full" />
            </div>
          </div>
        ) : error ? (
          <div className="flex h-[50px] items-center justify-center mb-4">
            <div className="text-center text-amber-500">{error}</div>
          </div>
        ) : null}

        <div className="space-y-6">
          {/* Category Filter Tabs */}
          <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All News</TabsTrigger>
              <TabsTrigger value="bullish">Bullish</TabsTrigger>
              <TabsTrigger value="bearish">Bearish</TabsTrigger>
              <TabsTrigger value="neutral">Neutral</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Featured News Article */}
          {featuredNews && (
            <article className="featured-news border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <a href={featuredNews.url} target="_blank" rel="noopener noreferrer" className="block">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(featuredNews.category)}
                      <Badge variant="outline" className="text-xs">
                        {featuredNews.source}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(featuredNews.publishedAt)}
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
                    {featuredNews.title}
                  </h2>

                  <p className="text-sm text-muted-foreground mb-3">{featuredNews.description}</p>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {featuredNews.tags.slice(0, 5).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-primary hover:underline flex items-center">
                      Read full article <ExternalLink className="h-3 w-3 ml-1" />
                    </span>
                    <span>{formatTimeAgo(featuredNews.publishedAt)}</span>
                  </div>
                </div>
              </a>
            </article>
          )}

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredNews.slice(0, 3).map((item, index) => (
              <article key={item.id} className="news-card h-full">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="block h-full">
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-xs">
                          {item.source}
                        </Badge>
                        {getCategoryBadge(item.category)}
                      </div>
                      <h3 className="font-medium text-sm mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-3 mb-2">{item.description}</p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{formatTimeAgo(item.publishedAt)}</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </article>
            ))}
          </div>

          {/* Recent Headlines */}
          <div>
            <h3 className="text-sm font-medium mb-2">Recent Headlines</h3>
            <div className="space-y-2">
              {filteredNews.slice(3, 10).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs h-5 min-w-[60px] flex items-center justify-center">
                      {item.source}
                    </Badge>
                    <span className="text-sm line-clamp-1">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(item.category)}
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(item.publishedAt)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

