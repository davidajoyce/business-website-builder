/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as conversations from "../conversations.js";
import type * as documents from "../documents.js";
import type * as firecrawl from "../firecrawl.js";
import type * as http from "../http.js";
import type * as reviews from "../reviews.js";
import type * as router from "../router.js";
import type * as seo from "../seo.js";
import type * as urlFilter from "../urlFilter.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  auth: typeof auth;
  conversations: typeof conversations;
  documents: typeof documents;
  firecrawl: typeof firecrawl;
  http: typeof http;
  reviews: typeof reviews;
  router: typeof router;
  seo: typeof seo;
  urlFilter: typeof urlFilter;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
