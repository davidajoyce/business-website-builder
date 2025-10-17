import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { LANDING_PAGE_SPEC_TEMPLATE } from "./specTemplate";
import type { BusinessReviewsResult } from "./reviews";
import type { WebsiteContentResult } from "./firecrawl";
import type { SEOAnalysisResult } from "./seo";

export const generateWebsiteSpec = action({
  args: {
    conversationId: v.id("conversations"),
    userInput: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    // Get the conversation to understand context
    const conversation = await ctx.runQuery(api.conversations.getConversation, {
      conversationId: args.conversationId,
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Fetch external data in parallel (reviews, website content, etc.)
    const reviewsPromise: Promise<BusinessReviewsResult | null> = conversation.businessName
      ? ctx.runAction(api.reviews.fetchBusinessReviews, {
          businessName: conversation.businessName,
        }).catch((error) => {
          console.error("[AI] Reviews fetch failed:", error);
          return null;
        })
      : Promise.resolve(null);

    const websiteContentPromise: Promise<WebsiteContentResult | null> = conversation.websiteUrl
      ? ctx.runAction(api.firecrawl.fetchWebsiteContent, {
          websiteUrl: conversation.websiteUrl,
          businessContext: conversation.businessName || args.userInput,
        }).catch((error) => {
          console.error("[AI] Website content fetch failed:", error);
          return null;
        })
      : Promise.resolve(null);

    const seoPromise: Promise<SEOAnalysisResult | null> = conversation.websiteUrl
      ? ctx.runAction(api.seo.fetchSEOAnalysis, {
          websiteUrl: conversation.websiteUrl,
        }).catch((error) => {
          console.error("[AI] SEO analysis fetch failed:", error);
          return null;
        })
      : Promise.resolve(null);

    // Wait for all data fetching to complete in parallel
    console.log("[AI] Waiting for external data (reviews + website content + SEO)...");
    const [reviewsData, websiteContentData, seoData] = await Promise.all([
      reviewsPromise,
      websiteContentPromise,
      seoPromise,
    ]);
    console.log("[AI] External data fetching complete");

    // Check if a document already exists for this conversation
    let existingDocument = await ctx.runQuery(api.documents.getDocumentByConversation, {
      conversationId: args.conversationId,
    });

    let finalSpec: string;

    if (existingDocument) {
      // For updates, just append the update note to existing content
      finalSpec = existingDocument.content + `\n\n---\n\n**Update:** ${args.userInput}\n\n*Note: To regenerate the full spec with updates, please create a new conversation.*`;
    } else {
      // Create new specification using template
      console.log("[AI] Generating spec from template...");

      // Format customer reviews
      let reviewsContent = "No customer reviews available.";
      if (reviewsData && reviewsData.success && reviewsData.reviews.length > 0) {
        const reviewCount = reviewsData.reviews.length;
        reviewsContent = `**Business:** ${reviewsData.businessName}\n`;

        if (reviewsData.address) {
          reviewsContent += `**Address:** ${reviewsData.address}\n`;
        }

        // Use overall rating from Google Places if available
        if (reviewsData.rating && reviewsData.userRatingCount) {
          reviewsContent += `**Overall Rating:** ${reviewsData.rating}/5 ⭐ (${reviewsData.userRatingCount} total ratings on Google)\n`;
          reviewsContent += `**Sample Reviews Shown:** ${reviewCount} reviews\n`;
        } else {
          // Fallback to calculating from reviews
          const avgRating = (reviewsData.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1);
          reviewsContent += `**Average Rating:** ${avgRating}/5 ⭐ (${reviewCount} reviews)\n`;
        }

        if (reviewsData.googleMapsUri) {
          reviewsContent += `**[View all reviews on Google Maps](${reviewsData.googleMapsUri})**\n`;
        }
        reviewsContent += `\n`;

        reviewsData.reviews.forEach((review, index) => {
          reviewsContent += `### Review ${index + 1}\n`;
          reviewsContent += `**Author:** ${review.author}\n`;
          reviewsContent += `**Rating:** ${review.rating}/5 ⭐\n`;
          reviewsContent += `**Date:** ${review.publishTime}\n\n`;
          reviewsContent += `> ${review.text}\n\n`;
        });
      }

      // Format website content
      let websiteContent = "No website content available.";
      if (websiteContentData && websiteContentData.success && websiteContentData.content.length > 0) {
        websiteContent = `**Source:** ${websiteContentData.baseUrl}\n`;
        websiteContent += `**Total URLs Found:** ${websiteContentData.totalUrls}\n`;
        websiteContent += `**URLs Scraped:** ${websiteContentData.scrapedUrls}\n\n`;

        websiteContentData.content.forEach((scraped, index) => {
          websiteContent += `### ${scraped.title || `Page ${index + 1}`}\n`;
          websiteContent += `**URL:** ${scraped.url}\n\n`;
          websiteContent += `${scraped.markdown}\n\n`;
        });
      }

      // Format SEO analysis
      let seoContent = "No SEO analysis available.";
      if (seoData && seoData.success && seoData.markdown) {
        seoContent = `**Source:** ${seoData.url}\n`;
        seoContent += `**Focus Area:** Content Optimization (Hero, Services, Header, Meta, FAQ, CTAs, etc.)\n\n`;
        seoContent += seoData.markdown;
      }

      // Replace placeholders in template
      finalSpec = LANDING_PAGE_SPEC_TEMPLATE
        .replace("{CUSTOMER_REVIEWS}", reviewsContent)
        .replace("{SEO_REPORT}", seoContent)
        .replace("{WEBSITE_CONTENT}", websiteContent);

      console.log("[AI] Spec generation complete");
    }

    // Add the AI response to the conversation
    await ctx.runMutation(api.conversations.addMessage, {
      conversationId: args.conversationId,
      role: "assistant",
      content: existingDocument ? `Updated the specification based on your request.` : `Created a comprehensive landing page specification.`,
    });

    if (existingDocument) {
      // Update existing document
      await ctx.runMutation(api.documents.updateDocument, {
        documentId: existingDocument._id,
        content: finalSpec,
      });
    } else {
      // Create new document
      await ctx.runMutation(api.documents.createDocument, {
        conversationId: args.conversationId,
        title: `Landing Page Spec - ${conversation.title}`,
        content: finalSpec,
      });
    }

    return finalSpec;
  },
});
