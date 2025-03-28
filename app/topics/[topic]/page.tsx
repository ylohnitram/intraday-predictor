"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

interface NewsArticle {
  id: string
  title: string
  description: string
  publishedAt: string
  source: string
  category: string
  slug: string
  url: string
}

export default function TopicPage({ params }: { params: { topic: string } }) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const topic = params.topic.replace(/-/g, " ")

  useEffect(() => {
    fetchArticles()
  }, [params.topic])

  const fetchArticles = async () => {
    try {
      setLoading(true)

      // Fetch from CryptoCompare API
      const response = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC")

      if (!response.ok) {
        throw new Error("Failed to fetch news")
      }

      const data = await response.json()

      if (!data || !data.Data) {
        throw new Error("Invalid data format")
      }

      // Filter articles that match the topic
      const topicKeywords = topic.split(" ")
      const filteredArticles = data.Data.filter((item: any) => {
        const combinedText = (item.title + " " + (item.body || "")).toLowerCase()
        return topicKeywords.some((keyword) => combinedText.includes(keyword.toLowerCase()))
      })

      // If no articles match the topic, use all articles
      const articlesToUse = filteredArticles.length > 0 ? filteredArticles : data.Data

      // Transform to our format
      const newsArticles: NewsArticle[] = articlesToUse.map((item: any) => {
        // Determine category
        let category = "neutral"
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
        ]

        const combinedText = (item.title + " " + (item.body || "")).toLowerCase()
        const bullishCount = bullishTerms.filter((term) => combinedText.includes(term)).length
        const bearishCount = bearishTerms.filter((term) => combinedText.includes(term)).length

        if (bullishCount > bearishCount) {
          category = "bullish"
        } else if (bearishCount > bullishCount) {
          category = "bearish"
        }

        // Generate slug
        const slug = item.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .substring(0, 100)

        return {
          id: item.id || `news-${Math.random().toString(36).substring(2, 9)}`,
          title: item.title,
          description: item.body ? item.body.substring(0, 150) + "..." : item.title,
          publishedAt: item.published_on ? new Date(item.published_on * 1000).toISOString() : new Date().toISOString(),
          source: item.source,
          category,
          slug,
          url: item.url,
        }
      })

      setArticles(newsArticles)
    } catch (error) {
      console.error("Error fetching articles:", error)

      // Fallback to default articles
      setArticles([
        {
          id: "1",
          title: "Bitcoin Price Analysis: BTC Consolidates Near Key Support Level",
          description:
            "Bitcoin is showing signs of stability as it trades near a critical support zone. Technical indicators suggest a potential bullish reversal if current levels hold.",
          publishedAt: new Date().toISOString(),
          source: "BTC Intraday Predictor",
          category: "neutral",
          slug: "bitcoin-price-analysis-btc-consolidates-near-key-support-level",
          url: "#",
        },
        {
          id: "2",
          title: "Market Sentiment Shifts as Bitcoin Approaches $90,000",
          description:
            "Investor sentiment is improving as Bitcoin tests resistance near $90,000. On-chain metrics indicate accumulation by long-term holders.",
          publishedAt: new Date(Date.now() - 86400000).toISOString(),
          source: "BTC Intraday Predictor",
          category: "bullish",
          slug: "market-sentiment-shifts-as-bitcoin-approaches-90000",
          url: "#",
        },
        {
          id: "3",
          title: "Bitcoin Volatility Increases: What Traders Should Watch",
          description:
            "Bitcoin's 30-day volatility has reached a 3-month high. Here's what traders should monitor in the coming days.",
          publishedAt: new Date(Date.now() - 172800000).toISOString(),
          source: "BTC Intraday Predictor",
          category: "neutral",
          slug: "bitcoin-volatility-increases-what-traders-should-watch",
          url: "#",
        },
        {
          id: "4",
          title: "Technical Analysis: Bitcoin Forms Bearish Pattern on Daily Chart",
          description:
            "Bitcoin has formed a potential head and shoulders pattern on the daily timeframe. Key levels to watch for confirmation.",
          publishedAt: new Date(Date.now() - 259200000).toISOString(),
          source: "BTC Intraday Predictor",
          category: "bearish",
          slug: "technical-analysis-bitcoin-forms-bearish-pattern-on-daily-chart",
          url: "#",
        },
        {
          id: "5",
          title: "Bitcoin's Correlation with Traditional Markets Reaches New Low",
          description:
            "Bitcoin's correlation with the S&P 500 has decreased significantly, suggesting potential for independent price action.",
          publishedAt: new Date(Date.now() - 345600000).toISOString(),
          source: "BTC Intraday Predictor",
          category: "bullish",
          slug: "bitcoins-correlation-with-traditional-markets-reaches-new-low",
          url: "#",
        },
        {
          id: "6",
          title: "On-Chain Analysis: Bitcoin Accumulation Trend Strengthens",
          description:
            "On-chain metrics reveal increasing accumulation by long-term holders despite recent price volatility.",
          publishedAt: new Date(Date.now() - 432000000).toISOString(),
          source: "BTC Intraday Predictor",
          category: "bullish",
          slug: "on-chain-analysis-bitcoin-accumulation-trend-strengthens",
          url: "#",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "bullish":
        return <Badge className="bg-green-500">Bullish</Badge>
      case "bearish":
        return <Badge className="bg-red-500">Bearish</Badge>
      default:
        return <Badge className="bg-yellow-500">Neutral</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="capitalize">{topic} News & Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Browse the latest news, analysis, and insights about {topic} in the cryptocurrency market. Stay informed
              with expert commentary and technical analysis.
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-20 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs">
                      {article.source}
                    </Badge>
                    {getCategoryBadge(article.category)}
                  </div>
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    <h3 className="font-medium text-base mb-2 hover:text-primary transition-colors">{article.title}</h3>
                  </a>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{article.description}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(article.publishedAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 pt-4 border-t">
          <h2 className="text-xl font-semibold mb-4">
            Popular {topic.charAt(0).toUpperCase() + topic.slice(1)} Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Price Analysis",
              "Market Trends",
              "Technical Indicators",
              "Trading Strategies",
              "On-Chain Metrics",
              "Sentiment Analysis",
              "Volatility",
              "Support & Resistance",
            ].map((subtopic, idx) => (
              <Link key={idx} href={`/topics/${(topic + "-" + subtopic).toLowerCase().replace(/\s+/g, "-")}`}>
                <Badge
                  variant="outline"
                  className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                >
                  {subtopic}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

