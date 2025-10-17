import { action } from "./_generated/server";
import { v } from "convex/values";

interface PlaceSearchResponse {
  places?: Array<{
    id: string;
    displayName: { text: string };
    formattedAddress?: string;
    websiteUri?: string;
  }>;
}

interface PlaceDetailsResponse {
  id: string;
  displayName: { text: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  reviews?: Array<{
    authorAttribution?: {
      displayName: string;
    };
    rating?: number;
    text?: {
      text: string;
    };
    publishTime?: string;
  }>;
}

export interface ReviewData {
  author: string;
  rating: number;
  text: string;
  publishTime: string;
}

export interface BusinessReviewsResult {
  success: boolean;
  businessName: string;
  placeId?: string;
  address?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  reviews: ReviewData[];
  error?: string;
}

/**
 * Search for a business place using Google Places API Text Search
 */
async function searchPlace(
  businessName: string,
  apiKey: string
): Promise<{ placeId: string; displayName: string; address?: string; websiteUri?: string } | null> {
  const url = "https://places.googleapis.com/v1/places:searchText";

  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.websiteUri",
  };

  const payload = {
    textQuery: businessName,
    regionCode: "AU",
    locationRestriction: {
      rectangle: {
        low: {
          latitude: -43.64,  // Southern point of Australia
          longitude: 113.09, // Western point of Australia
        },
        high: {
          latitude: -10.41,  // Northern point of Australia
          longitude: 153.64, // Eastern point of Australia
        },
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Google Places search failed: ${response.status} - ${errorText}`
      );
      return null;
    }

    const data = (await response.json()) as PlaceSearchResponse;

    console.log(`[Google Places Search] Query: "${businessName}"`);
    console.log(`[Google Places Search] Found ${data.places?.length || 0} places`);

    if (!data.places || data.places.length === 0) {
      console.log(`[Google Places Search] No places found for business: ${businessName}`);
      return null;
    }

    // Return the first (most relevant) result
    const place = data.places[0];
    console.log(`[Google Places Search] Selected place:`, {
      placeId: place.id,
      displayName: place.displayName.text,
      address: place.formattedAddress,
      websiteUri: place.websiteUri,
    });

    return {
      placeId: place.id,
      displayName: place.displayName.text,
      address: place.formattedAddress,
      websiteUri: place.websiteUri,
    };
  } catch (error) {
    console.error("Error searching for place:", error);
    return null;
  }
}

/**
 * Fetch reviews for a specific place ID
 */
async function fetchPlaceReviews(
  placeId: string,
  apiKey: string
): Promise<{ reviews: ReviewData[]; googleMapsUri?: string; rating?: number; userRatingCount?: number; displayName?: string; formattedAddress?: string }> {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": "id,displayName,formattedAddress,rating,userRatingCount,reviews,googleMapsUri",
  };

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Google Places reviews fetch failed: ${response.status} - ${errorText}`
      );
      return { reviews: [] };
    }

    const data = (await response.json()) as PlaceDetailsResponse;

    console.log(`[Google Places Reviews] Place ID: ${placeId}`);
    console.log(`[Google Places Reviews] Found ${data.reviews?.length || 0} reviews`);

    if (!data.reviews || data.reviews.length === 0) {
      console.log(`[Google Places Reviews] No reviews found for place: ${placeId}`);
      return {
        reviews: [],
        googleMapsUri: data.googleMapsUri,
        rating: data.rating,
        userRatingCount: data.userRatingCount,
        displayName: data.displayName?.text,
        formattedAddress: data.formattedAddress,
      };
    }

    // Transform reviews into our format
    const transformedReviews = data.reviews.map((review) => ({
      author: review.authorAttribution?.displayName || "Anonymous",
      rating: review.rating || 0,
      text: review.text?.text || "No text provided",
      publishTime: review.publishTime || "Unknown date",
    }));

    console.log(`[Google Places Reviews] All ${transformedReviews.length} reviews:`);
    console.log(`[Google Places Reviews] Overall Rating: ${data.rating || 'N/A'}/5 (${data.userRatingCount || 0} total ratings)`);
    transformedReviews.forEach((review, index) => {
      console.log(`\nReview #${index + 1}:`);
      console.log(`  Author: ${review.author}`);
      console.log(`  Rating: ${review.rating}/5`);
      console.log(`  Date: ${review.publishTime}`);
      console.log(`  Text: ${review.text}`);
    });

    if (data.googleMapsUri) {
      console.log(`\n[Google Places Reviews] Google Maps Link: ${data.googleMapsUri}`);
    }

    return {
      reviews: transformedReviews,
      googleMapsUri: data.googleMapsUri,
      rating: data.rating,
      userRatingCount: data.userRatingCount,
      displayName: data.displayName?.text,
      formattedAddress: data.formattedAddress,
    };
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return { reviews: [] };
  }
}

/**
 * Main action to fetch business reviews
 * This is called from the AI spec generation flow
 */
export const fetchBusinessReviews = action({
  args: {
    businessName: v.string(),
  },
  handler: async (_, args): Promise<BusinessReviewsResult> => {
    console.log(`\n========================================`);
    console.log(`[fetchBusinessReviews] Starting for: "${args.businessName}"`);
    console.log(`========================================\n`);

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.error("[fetchBusinessReviews] ERROR: GOOGLE_PLACES_API_KEY not found in environment variables");
      return {
        success: false,
        businessName: args.businessName,
        reviews: [],
        error: "Google Places API key not configured",
      };
    }

    try {
      // Step 1: Search for the business place
      const placeInfo = await searchPlace(args.businessName, apiKey);

      if (!placeInfo) {
        console.log(`[fetchBusinessReviews] FAILED: Business not found`);
        return {
          success: false,
          businessName: args.businessName,
          reviews: [],
          error: "Business not found on Google Places",
        };
      }

      // Step 2: Fetch reviews for the place
      const { reviews, googleMapsUri, rating, userRatingCount, displayName, formattedAddress } = await fetchPlaceReviews(placeInfo.placeId, apiKey);

      console.log(`\n[fetchBusinessReviews] SUCCESS Summary:`);
      console.log(`- Business: ${displayName || args.businessName}`);
      console.log(`- Place ID: ${placeInfo.placeId}`);
      console.log(`- Address: ${formattedAddress || placeInfo.address || 'N/A'}`);
      console.log(`- Google Maps URL: ${googleMapsUri || 'N/A'}`);
      console.log(`- Overall Rating: ${rating || 'N/A'}/5 (${userRatingCount || 0} total ratings)`);
      console.log(`- Reviews fetched: ${reviews.length}`);
      console.log(`========================================\n`);

      return {
        success: true,
        businessName: displayName || args.businessName,
        placeId: placeInfo.placeId,
        address: formattedAddress || placeInfo.address,
        googleMapsUri,
        rating,
        userRatingCount,
        reviews,
      };
    } catch (error) {
      console.error("[fetchBusinessReviews] ERROR:", error);
      return {
        success: false,
        businessName: args.businessName,
        reviews: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export interface BusinessInfoResult {
  success: boolean;
  businessName: string;
  websiteUrl?: string;
  address?: string;
  placeId?: string;
  error?: string;
}

/**
 * Get basic business information including website URL from Google Places
 * This is called from the frontend before creating a conversation
 */
export const getBusinessInfo = action({
  args: {
    businessName: v.string(),
  },
  handler: async (_, args): Promise<BusinessInfoResult> => {
    console.log(`\n========================================`);
    console.log(`[getBusinessInfo] Looking up: "${args.businessName}"`);
    console.log(`========================================\n`);

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.error("[getBusinessInfo] ERROR: GOOGLE_PLACES_API_KEY not found");
      return {
        success: false,
        businessName: args.businessName,
        error: "Google Places API key not configured",
      };
    }

    try {
      const placeInfo = await searchPlace(args.businessName, apiKey);

      if (!placeInfo) {
        console.log(`[getBusinessInfo] Business not found: "${args.businessName}"`);
        return {
          success: false,
          businessName: args.businessName,
          error: "Business not found on Google Places",
        };
      }

      console.log(`\n[getBusinessInfo] SUCCESS:`);
      console.log(`- Business: ${placeInfo.displayName}`);
      console.log(`- Address: ${placeInfo.address || 'N/A'}`);
      console.log(`- Website: ${placeInfo.websiteUri || 'Not found'}`);
      console.log(`========================================\n`);

      return {
        success: true,
        businessName: placeInfo.displayName,
        websiteUrl: placeInfo.websiteUri,
        address: placeInfo.address,
        placeId: placeInfo.placeId,
      };
    } catch (error) {
      console.error("[getBusinessInfo] ERROR:", error);
      return {
        success: false,
        businessName: args.businessName,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
