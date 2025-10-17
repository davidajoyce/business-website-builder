import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Firecrawl API response types
interface MapResponse {
  success: boolean;
  links?: Array<{
    url: string;
    title?: string;
    description?: string;
  }>;
  error?: string;
}

interface ScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    metadata?: {
      title?: string;
      description?: string;
      sourceURL?: string;
    };
  };
  error?: string;
}

export interface ScrapedContent {
  url: string;
  title?: string;
  markdown: string;
  error?: string;
}

export interface WebsiteContentResult {
  success: boolean;
  baseUrl: string;
  totalUrls: number;
  scrapedUrls: number;
  content: ScrapedContent[];
  error?: string;
}

/**
 * Map a website to get all URLs using Firecrawl /v2/map endpoint
 */
async function mapWebsite(url: string, apiKey: string): Promise<MapResponse> {
  const mapUrl = "https://api.firecrawl.dev/v2/map";

  const options = {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: url,
      limit: 5000,
      includeSubdomains: false,
      sitemap: "skip",
    }),
  };

  try {
    const response = await fetch(mapUrl, options);
    const data = await response.json();

    console.log(`[Firecrawl Map] URL: ${url}`);
    console.log(`[Firecrawl Map] Found ${data.links?.length || 0} URLs`);

    return data as MapResponse;
  } catch (error) {
    console.error("[Firecrawl Map] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Scrape a single URL for markdown content using Firecrawl /v2/scrape endpoint
 * with a 15-second timeout per request
 */
async function scrapeUrl(url: string, apiKey: string): Promise<ScrapeResponse> {
  const scrapeUrl = "https://api.firecrawl.dev/v2/scrape";
  const TIMEOUT_MS = 15000; // 15 seconds per URL (reduced from 30s)

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: url,
      onlyMainContent: true, // Extract only main content, exclude headers/navs/footers
      removeBase64Images: true, // Remove images from output (default true, but explicit)
      blockAds: true, // Block ads for cleaner content
      excludeTags: ["img", "picture", "svg"], // Explicitly exclude image tags
      maxAge: 172800000,
      parsers: [], // No PDF parsing
      formats: ["markdown"], // Only markdown, no screenshots
      waitFor: 5000,
    }),
  };

  // Create a timeout promise
  const timeoutPromise = new Promise<ScrapeResponse>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);
  });

  // Race between fetch and timeout
  const fetchPromise = (async () => {
    try {
      console.log(`[Firecrawl Scrape] Sending request for ${url}...`);
      const response = await fetch(scrapeUrl, options);
      console.log(`[Firecrawl Scrape] Received response for ${url}, status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Firecrawl Scrape] HTTP ${response.status} for ${url}:`, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      console.log(`[Firecrawl Scrape] Parsed JSON for ${url}, success: ${data.success}`);
      return data as ScrapeResponse;
    } catch (error) {
      console.error(`[Firecrawl Scrape] Error scraping ${url}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })();

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error(`[Firecrawl Scrape] Timeout or error for ${url}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request timeout",
    };
  }
}

/**
 * Scrape multiple URLs with controlled concurrency to respect Firecrawl rate limits
 * Free tier: 2 concurrent, Hobby: 5, Standard: 50, Growth: 100
 */
export const scrapeMultipleUrls = action({
  args: {
    urls: v.array(v.string()),
    maxConcurrency: v.optional(v.number()), // Default to 2 for free tier
  },
  handler: async (_, args): Promise<ScrapedContent[]> => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    const MAX_CONCURRENT = args.maxConcurrency || 2; // Conservative default for free tier

    if (!apiKey) {
      console.error("[Firecrawl] FIRECRAWL_API_KEY not found");
      return [];
    }

    console.log(`[Firecrawl] Starting scrape of ${args.urls.length} URLs with max concurrency: ${MAX_CONCURRENT}`);
    console.log(`[Firecrawl] URLs to scrape:`, args.urls);

    const results: ScrapedContent[] = [];
    let completed = 0;

    // Process URLs in batches with controlled concurrency
    for (let i = 0; i < args.urls.length; i += MAX_CONCURRENT) {
      const batch = args.urls.slice(i, i + MAX_CONCURRENT);
      console.log(`[Firecrawl] Processing batch ${Math.floor(i / MAX_CONCURRENT) + 1}: ${batch.length} URLs`);

      const batchPromises = batch.map(async (url, batchIndex) => {
        const overallIndex = i + batchIndex;
        console.log(`[Firecrawl] [${overallIndex + 1}/${args.urls.length}] Starting scrape: ${url}`);
        const startTime = Date.now();

        try {
          const result = await scrapeUrl(url, apiKey);
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);

          if (!result.success || !result.data?.markdown) {
            console.log(`[Firecrawl] [${overallIndex + 1}/${args.urls.length}] Failed to scrape ${url} (${duration}s): ${result.error}`);
            return {
              url,
              markdown: "",
              error: result.error || "Failed to extract markdown",
            };
          }

          console.log(`[Firecrawl] [${overallIndex + 1}/${args.urls.length}] Successfully scraped ${url} (${duration}s, ${result.data.markdown.length} chars)`);

          return {
            url,
            title: result.data.metadata?.title,
            markdown: result.data.markdown,
          };
        } catch (error) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          console.error(`[Firecrawl] [${overallIndex + 1}/${args.urls.length}] Exception scraping ${url} (${duration}s):`, errorMsg);
          return {
            url,
            markdown: "",
            error: errorMsg,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      completed += batchResults.length;

      console.log(`[Firecrawl] Batch complete. Progress: ${completed}/${args.urls.length}`);
    }

    const successCount = results.filter(r => !r.error).length;
    console.log(`[Firecrawl] Scraping complete: ${successCount}/${args.urls.length} successful`);

    return results;
  },
});

/**
 * Main action to fetch website content: map → filter → scrape
 * This is called from the AI spec generation flow in parallel with reviews
 */
export const fetchWebsiteContent = action({
  args: {
    websiteUrl: v.string(),
    businessContext: v.string(), // Business name/description for filtering
  },
  handler: async (ctx, args): Promise<WebsiteContentResult> => {
    console.log(`\n========================================`);
    console.log(`[fetchWebsiteContent] Starting for: "${args.websiteUrl}"`);
    console.log(`========================================\n`);

    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
      console.error("[fetchWebsiteContent] ERROR: FIRECRAWL_API_KEY not found");
      return {
        success: false,
        baseUrl: args.websiteUrl,
        totalUrls: 0,
        scrapedUrls: 0,
        content: [],
        error: "Firecrawl API key not configured",
      };
    }

    try {
      // Step 1: Map the website to get all URLs
      const mapResult = await mapWebsite(args.websiteUrl, apiKey);

      if (!mapResult.success || !mapResult.links || mapResult.links.length === 0) {
        console.log(`[fetchWebsiteContent] FAILED: Could not map website`);
        return {
          success: false,
          baseUrl: args.websiteUrl,
          totalUrls: 0,
          scrapedUrls: 0,
          content: [],
          error: mapResult.error || "Could not map website URLs",
        };
      }

      const allUrls = mapResult.links;
      console.log(`[fetchWebsiteContent] Found ${allUrls.length} URLs`);

      // Step 2: Filter URLs using OpenAI to select most relevant
      const urlsToScrape = await ctx.runAction(api.urlFilter.filterRelevantUrls, {
        urls: allUrls,
        businessContext: args.businessContext,
        maxUrls: 5, // Reduced from 10 to avoid Convex 600s timeout
      });
      console.log(`[fetchWebsiteContent] AI selected ${urlsToScrape.length} URLs to scrape`);

      // Step 3: Scrape selected URLs in parallel
      const scrapedContent = await ctx.runAction(api.firecrawl.scrapeMultipleUrls, {
        urls: urlsToScrape,
      });

      const successfulScrapes = scrapedContent.filter(c => !c.error);

      console.log(`\n[fetchWebsiteContent] SUCCESS Summary:`);
      console.log(`- Website: ${args.websiteUrl}`);
      console.log(`- Total URLs found: ${allUrls.length}`);
      console.log(`- URLs scraped: ${successfulScrapes.length}`);
      console.log(`========================================\n`);

      return {
        success: true,
        baseUrl: args.websiteUrl,
        totalUrls: allUrls.length,
        scrapedUrls: successfulScrapes.length,
        content: successfulScrapes,
      };
    } catch (error) {
      console.error("[fetchWebsiteContent] ERROR:", error);
      return {
        success: false,
        baseUrl: args.websiteUrl,
        totalUrls: 0,
        scrapedUrls: 0,
        content: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
