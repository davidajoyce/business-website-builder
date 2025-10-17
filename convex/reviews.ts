import { action } from "./_generated/server";
import { v } from "convex/values";

interface PlaceSearchResponse {
  places?: Array<{
    id: string;
    displayName: { text: string };
    formattedAddress?: string;
  }>;
}

interface PlaceDetailsResponse {
  id: string;
  displayName: { text: string };
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
  reviews: ReviewData[];
  error?: string;
}

/**
 * Search for a business place using Google Places API Text Search
 */
async function searchPlace(
  businessName: string,
  apiKey: string
): Promise<{ placeId: string; displayName: string; address?: string } | null> {
  const url = "https://places.googleapis.com/v1/places:searchText";

  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
  };

  const payload = {
    textQuery: businessName,
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

    if (!data.places || data.places.length === 0) {
      console.log(`No places found for business: ${businessName}`);
      return null;
    }

    // Return the first (most relevant) result
    const place = data.places[0];
    return {
      placeId: place.id,
      displayName: place.displayName.text,
      address: place.formattedAddress,
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
): Promise<ReviewData[]> {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": "id,displayName,reviews",
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
      return [];
    }

    const data = (await response.json()) as PlaceDetailsResponse;

    if (!data.reviews || data.reviews.length === 0) {
      console.log(`No reviews found for place: ${placeId}`);
      return [];
    }

    // Transform reviews into our format
    return data.reviews.map((review) => ({
      author: review.authorAttribution?.displayName || "Anonymous",
      rating: review.rating || 0,
      text: review.text?.text || "No text provided",
      publishTime: review.publishTime || "Unknown date",
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
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
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.error("GOOGLE_PLACES_API_KEY not found in environment variables");
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
        return {
          success: false,
          businessName: args.businessName,
          reviews: [],
          error: "Business not found on Google Places",
        };
      }

      // Step 2: Fetch reviews for the place
      const reviews = await fetchPlaceReviews(placeInfo.placeId, apiKey);

      return {
        success: true,
        businessName: args.businessName,
        placeId: placeInfo.placeId,
        address: placeInfo.address,
        reviews,
      };
    } catch (error) {
      console.error("Error in fetchBusinessReviews:", error);
      return {
        success: false,
        businessName: args.businessName,
        reviews: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
