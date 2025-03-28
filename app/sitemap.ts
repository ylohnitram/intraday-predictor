import type { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://btc-intraday-predictor.vercel.app"

  // Main pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/signals`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/statistics`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/calculator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/settings`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]

  // Topic pages
  const topics = ["bitcoin", "cryptocurrency", "blockchain", "trading", "market-analysis", "defi", "nfts", "altcoins"]

  const topicPages = topics.map((topic) => ({
    url: `${baseUrl}/topics/${topic}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  // Try to fetch real news articles for dynamic sitemap entries
  let articlePages = []
  try {
    const response = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC")

    if (response.ok) {
      const data = await response.json()

      if (data && data.Data) {
        articlePages = data.Data.slice(0, 20).map((item: any) => {
          const slug = item.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .substring(0, 100)

          return {
            url: `${baseUrl}/news/${slug}`,
            lastModified: item.published_on ? new Date(item.published_on * 1000) : new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          }
        })
      }
    }
  } catch (error) {
    console.error("Error fetching news for sitemap:", error)
    // Fallback to sample articles if API fails
    const sampleArticles = [
      "bitcoin-price-analysis-btc-consolidates-near-key-support-level",
      "market-sentiment-shifts-as-bitcoin-approaches-90000",
      "bitcoin-volatility-increases-what-traders-should-watch",
      "technical-analysis-bitcoin-forms-bearish-pattern-on-daily-chart",
      "bitcoins-correlation-with-traditional-markets-reaches-new-low",
      "on-chain-analysis-bitcoin-accumulation-trend-strengthens",
    ]

    articlePages = sampleArticles.map((slug) => ({
      url: `${baseUrl}/news/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }))
  }

  return [...staticPages, ...topicPages, ...articlePages]
}

