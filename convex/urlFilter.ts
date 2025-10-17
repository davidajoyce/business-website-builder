import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

interface UrlCandidate {
  url: string;
  title?: string;
  description?: string;
}

/**
 * Use OpenAI to filter and select the most relevant URLs to scrape
 * for building a new website based on business context
 */
export const filterRelevantUrls = action({
  args: {
    urls: v.array(
      v.object({
        url: v.string(),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
    businessContext: v.string(),
    maxUrls: v.optional(v.number()), // Default to 5
  },
  handler: async (_, args): Promise<string[]> => {
    const maxUrls = args.maxUrls || 5; // Reduced from 10 to avoid timeouts

    console.log(`[URL Filter] Filtering ${args.urls.length} URLs for: "${args.businessContext}"`);

    // If we have fewer URLs than the max, return all of them
    if (args.urls.length <= maxUrls) {
      console.log(`[URL Filter] Returning all ${args.urls.length} URLs (under max)`);
      return args.urls.map(u => u.url);
    }

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: "https://api.openai.com/v1",
      });

      // Create a formatted list of URLs for the AI to analyze
      const urlList = args.urls
        .map((url, index) => {
          let entry = `${index + 1}. ${url.url}`;
          if (url.title) entry += `\n   Title: ${url.title}`;
          if (url.description) entry += `\n   Description: ${url.description}`;
          return entry;
        })
        .join("\n\n");

      const systemPrompt = `You are a web content analyst. Your task is to select the most relevant URLs from a website that would provide valuable information for building a new website for a business.

Focus on URLs that likely contain:
- Information about services/products
- Company background and mission
- Team/about information
- Portfolio or case studies
- Testimonials or client feedback
- Pricing information
- Contact details

Avoid URLs that are:
- Login/signup pages
- Shopping cart or checkout pages
- Privacy policies, terms of service (unless specifically requested)
- Blog posts (unless they showcase expertise)
- Redundant or duplicate content

Return ONLY a JSON array of the URL strings (not indices), in order of importance. Select the top ${maxUrls} URLs.`;

      const userMessage = `Business Context: ${args.businessContext}

Available URLs:
${urlList}

Please select the ${maxUrls} most relevant URLs that would provide valuable information for building this business's new website. Return a JSON array of URL strings only.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3, // Lower temperature for more consistent selection
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });

      const responseContent = completion.choices[0].message.content || "{}";

      // Parse the JSON response
      let selectedUrls: string[] = [];
      try {
        const parsed = JSON.parse(responseContent);
        // Handle various possible response formats
        if (Array.isArray(parsed)) {
          selectedUrls = parsed;
        } else if (parsed.urls && Array.isArray(parsed.urls)) {
          selectedUrls = parsed.urls;
        } else if (parsed.selected_urls && Array.isArray(parsed.selected_urls)) {
          selectedUrls = parsed.selected_urls;
        } else {
          // If we can't parse it, fall back to first N URLs
          console.warn("[URL Filter] Could not parse AI response, using fallback");
          selectedUrls = args.urls.slice(0, maxUrls).map(u => u.url);
        }
      } catch (parseError) {
        console.error("[URL Filter] JSON parse error:", parseError);
        // Fallback to first N URLs
        selectedUrls = args.urls.slice(0, maxUrls).map(u => u.url);
      }

      // Validate that selected URLs are in the original list
      const validUrls = selectedUrls.filter(url =>
        args.urls.some(candidate => candidate.url === url)
      );

      // If we got fewer than expected, add more from the original list
      if (validUrls.length < maxUrls) {
        const remainingUrls = args.urls
          .filter(u => !validUrls.includes(u.url))
          .slice(0, maxUrls - validUrls.length)
          .map(u => u.url);
        validUrls.push(...remainingUrls);
      }

      console.log(`[URL Filter] Selected ${validUrls.length} URLs using AI`);
      console.log(`[URL Filter] URLs:`, validUrls);

      return validUrls;
    } catch (error) {
      console.error("[URL Filter] Error using OpenAI:", error);

      // Fallback: return first N URLs
      console.log(`[URL Filter] Using fallback: first ${maxUrls} URLs`);
      return args.urls.slice(0, maxUrls).map(u => u.url);
    }
  },
});
