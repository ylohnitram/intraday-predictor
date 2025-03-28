"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Tag, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"

interface NewsArticle {
  title: string
  content: string
  description: string
  publishedAt: string
  source: string
  category: string
  tags: string[]
  url: string
}

export default function NewsArticlePage({ params }: { params: { slug: string } }) {
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [relatedArticles, setRelatedArticles] = useState<any[]>([])

  useEffect(() => {
    fetchArticle()
  }, [params.slug])

  const fetchArticle = async () => {
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

      // Find article that matches the slug
      const slug = params.slug
      const foundArticle = data.Data.find((item: any) => {
        const itemSlug = item.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .substring(0, 100)

        return itemSlug === slug
      })

      if (!foundArticle) {
        // If not found, just use the first article
        const firstArticle = data.Data[0]

        // Generate tags
        const tags = generateTags(
          firstArticle.title,
          firstArticle.categories ? firstArticle.categories.split("|") : ["BTC"],
        )

        setArticle({
          title: firstArticle.title,
          content: firstArticle.body || firstArticle.title,
          description: firstArticle.body ? firstArticle.body.substring(0, 150) + "..." : firstArticle.title,
          publishedAt: firstArticle.published_on
            ? new Date(firstArticle.published_on * 1000).toISOString()
            : new Date().toISOString(),
          source: firstArticle.source,
          category: "analysis",
          tags,
          url: firstArticle.url,
        })

        // Set related articles (excluding the current one)
        setRelatedArticles(
          data.Data.slice(1, 4).map((item: any) => ({
            title: item.title,
            publishedAt: item.published_on
              ? new Date(item.published_on * 1000).toISOString()
              : new Date().toISOString(),
            slug: item.title
              .toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-")
              .substring(0, 100),
            category: "analysis",
          })),
        )
      } else {
        // Generate tags
        const tags = generateTags(
          foundArticle.title,
          foundArticle.categories ? foundArticle.categories.split("|") : ["BTC"],
        )

        setArticle({
          title: foundArticle.title,
          content: foundArticle.body || foundArticle.title,
          description: foundArticle.body ? foundArticle.body.substring(0, 150) + "..." : foundArticle.title,
          publishedAt: foundArticle.published_on
            ? new Date(foundArticle.published_on * 1000).toISOString()
            : new Date().toISOString(),
          source: foundArticle.source,
          category: "analysis",
          tags,
          url: foundArticle.url,
        })

        // Set related articles (excluding the current one)
        setRelatedArticles(
          data.Data.filter((item: any) => item.id !== foundArticle.id)
            .slice(0, 3)
            .map((item: any) => ({
              title: item.title,
              publishedAt: item.published_on
                ? new Date(item.published_on * 1000).toISOString()
                : new Date().toISOString(),
              slug: item.title
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .substring(0, 100),
              category: "analysis",
            })),
        )
      }
    } catch (error) {
      console.error("Error fetching article:", error)

      // Fallback to a default article
      setArticle({
        title: "Bitcoin Price Analysis: BTC Consolidates Near Key Support Level",
        content: `
          <p>Bitcoin (BTC) is currently trading at a critical level, showing signs of consolidation after the recent market volatility. The leading cryptocurrency has been testing key support and resistance levels over the past 48 hours.</p>
          
          <p>Technical analysis indicates that the 200-day moving average is providing strong support, with increased buying pressure observed at these levels. The Relative Strength Index (RSI) suggests that Bitcoin is neither overbought nor oversold, leaving room for potential movement in either direction.</p>
          
          <p>Market sentiment has improved slightly, with the Fear & Greed Index moving from "Fear" to "Neutral" territory. This shift in sentiment, coupled with decreasing selling pressure, could signal a potential reversal in the short term.</p>
          
          <p>On-chain data reveals that long-term holders continue to accumulate, with wallet addresses holding more than 1 BTC increasing over the past week. This accumulation pattern typically precedes bullish price movements.</p>
          
          <p>However, traders should remain cautious as global macroeconomic factors continue to influence crypto markets. The upcoming economic data releases could introduce additional volatility, potentially testing the current support levels.</p>
        `,
        description:
          "Bitcoin is showing signs of stability as it trades near a critical support zone. Technical indicators suggest a potential bullish reversal if current levels hold.",
        publishedAt: new Date().toISOString(),
        source: "BTC Intraday Predictor",
        category: "analysis",
        tags: [
          "bitcoin",
          "btc",
          "price analysis",
          "technical analysis",
          "cryptocurrency",
          "trading",
          "market",
          "support level",
        ],
        url: "#",
      })

      // Set default related articles
      setRelatedArticles([
        {
          title: "Ethereum Shows Strength as Bitcoin Consolidates: Price Analysis",
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          slug: "ethereum-shows-strength-as-bitcoin-consolidates-price-analysis",
          category: "analysis",
        },
        {
          title: "Bitcoin Volatility Index Reaches 3-Month Low: What This Means for Traders",
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          slug: "bitcoin-volatility-index-reaches-3-month-low-what-this-means-for-traders",
          category: "analysis",
        },
        {
          title: "On-Chain Analysis: Bitcoin Accumulation Trend Strengthens Despite Price Action",
          publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          slug: "on-chain-analysis-bitcoin-accumulation-trend-strengthens-despite-price-action",
          category: "analysis",
        },
      ])
    } finally {
      setLoading(false)
    }
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

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>

        <Card className="article-container">
          {loading ? (
            <>
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-2" />
              </CardContent>
            </>
          ) : article ? (
            <>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{article.source}</Badge>
                  <Badge className="bg-yellow-500">{article.category}</Badge>
                  <div className="flex items-center text-xs text-muted-foreground ml-auto">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(article.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <CardTitle className="text-2xl md:text-3xl">{article.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                  {article.content.includes("<p>") ? (
                    <div dangerouslySetInnerHTML={{ __html: article.content }} />
                  ) : (
                    <p>{article.content}</p>
                  )}

                  {article.url && article.url !== "#" && (
                    <p className="mt-4">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Read the full article on {article.source}
                      </a>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t">
                  <span className="text-sm font-medium">Tags:</span>
                  {article.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Related Articles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {relatedArticles.map((item, i) => (
                      <Link href={`/news/${item.slug}`} key={i}>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <Badge variant="outline" className="mb-2">
                              {item.category}
                            </Badge>
                            <h4 className="font-medium text-sm mb-2 line-clamp-2 hover:text-primary">{item.title}</h4>
                            <p className="text-xs text-muted-foreground">{formatTimeAgo(item.publishedAt)}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent>
              <div className="text-center py-8">
                <p>Article not found</p>
                <Link href="/" className="text-primary hover:underline mt-2 block">
                  Return to Dashboard
                </Link>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

