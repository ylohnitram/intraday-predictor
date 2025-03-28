import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/settings",
    },
    sitemap: "https://btc-intraday-predictor.vercel.app/sitemap.xml",
  }
}

