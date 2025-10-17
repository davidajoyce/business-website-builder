import { action } from "./_generated/server";
import { v } from "convex/values";

// Gumloop API response types
interface StartPipelineResponse {
  run_id: string;
  state?: string;
}

interface RunResultResponse {
  state: "PENDING" | "RUNNING" | "DONE" | "FAILED";
  outputs?: {
    output?: string; // The markdown content
  };
  credit_cost?: number;
  child_run_credit_cost?: number;
  node_executions?: number;
  created_ts?: string;
  finished_ts?: string;
  error?: string;
}

export interface SEOAnalysisResult {
  success: boolean;
  url: string;
  markdown?: string;
  runId?: string;
  error?: string;
}

/**
 * Start a Gumloop SEO analysis pipeline
 */
async function startPipeline(
  url: string,
  apiKey: string,
  userId: string,
  savedItemId: string,
  focusArea: string
): Promise<StartPipelineResponse> {
  const apiUrl = `https://api.gumloop.com/api/v1/start_pipeline?user_id=${userId}&saved_item_id=${savedItemId}`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const payload = {
    url: url,
    focus_area: focusArea,
  };

  try {
    console.log(`[SEO] Starting pipeline for URL: ${url}`);
    console.log(`[SEO] Focus area: ${focusArea}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SEO] Start pipeline failed: ${response.status} - ${errorText}`);
      throw new Error(`Failed to start pipeline: ${response.status}`);
    }

    const data = (await response.json()) as StartPipelineResponse;
    console.log(`[SEO] Pipeline started with run_id: ${data.run_id}`);

    return data;
  } catch (error) {
    console.error("[SEO] Error starting pipeline:", error);
    throw error;
  }
}

/**
 * Get the current result/status of a pipeline run
 */
async function getRunResult(
  runId: string,
  apiKey: string,
  userId: string
): Promise<RunResultResponse> {
  const apiUrl = `https://api.gumloop.com/api/v1/get_pl_run?user_id=${userId}&run_id=${runId}`;

  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SEO] Get run result failed: ${response.status} - ${errorText}`);
      throw new Error(`Failed to get run result: ${response.status}`);
    }

    const data = (await response.json()) as RunResultResponse;
    return data;
  } catch (error) {
    console.error("[SEO] Error getting run result:", error);
    throw error;
  }
}

/**
 * Poll the pipeline status until completion or timeout
 * Max duration: 180 seconds (3 minutes)
 * Poll interval: 5 seconds
 */
async function pollUntilComplete(
  runId: string,
  apiKey: string,
  userId: string,
  maxDurationSeconds: number = 180,
  pollIntervalSeconds: number = 5
): Promise<RunResultResponse> {
  const startTime = Date.now();
  const maxDurationMs = maxDurationSeconds * 1000;
  const pollIntervalMs = pollIntervalSeconds * 1000;
  const maxAttempts = Math.ceil(maxDurationSeconds / pollIntervalSeconds);

  let attempt = 0;

  console.log(`[SEO] Starting polling (max ${maxDurationSeconds}s, interval ${pollIntervalSeconds}s)`);

  while (true) {
    attempt++;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    try {
      const result = await getRunResult(runId, apiKey, userId);
      const state = result.state;

      console.log(`[SEO] [${attempt}/${maxAttempts}] State: ${state} (${elapsed}s elapsed)`);

      if (state === "DONE") {
        console.log(`[SEO] ✓ Pipeline completed successfully (${elapsed}s total)`);
        if (result.outputs?.output) {
          console.log(`[SEO] Markdown content: ${result.outputs.output.length} characters`);
        }
        return result;
      }

      if (state === "FAILED") {
        console.error(`[SEO] ✗ Pipeline failed:`, result.error || "Unknown error");
        return result;
      }

      // Check timeout
      if (Date.now() - startTime >= maxDurationMs) {
        console.warn(`[SEO] ⚠️ Timeout after ${elapsed}s, pipeline still ${state}`);
        throw new Error(`Pipeline timeout after ${maxDurationSeconds}s`);
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`[SEO] Error during polling (${elapsed}s):`, error);
      throw error;
    }
  }
}

/**
 * Main action to fetch SEO analysis for a website
 * This is called from the AI spec generation flow in parallel with reviews and website scraping
 */
export const fetchSEOAnalysis = action({
  args: {
    websiteUrl: v.string(),
  },
  handler: async (_, args): Promise<SEOAnalysisResult> => {
    console.log(`\n========================================`);
    console.log(`[fetchSEOAnalysis] Starting for: "${args.websiteUrl}"`);
    console.log(`========================================\n`);

    const apiKey = process.env.GUMLOOP_API_KEY;
    const userId = process.env.GUMLOOP_USER_ID;
    const savedItemId = process.env.GUMLOOP_SAVED_ITEM_ID;
    const focusArea = process.env.GUMLOOP_FOCUS_AREA || "Content Optimization (Hero, Services, Header, Meta, FAQ, CTAs, etc.)";

    if (!apiKey || !userId || !savedItemId) {
      console.error("[fetchSEOAnalysis] ERROR: Missing Gumloop configuration");
      console.error(`- GUMLOOP_API_KEY: ${apiKey ? "set" : "missing"}`);
      console.error(`- GUMLOOP_USER_ID: ${userId ? "set" : "missing"}`);
      console.error(`- GUMLOOP_SAVED_ITEM_ID: ${savedItemId ? "set" : "missing"}`);
      return {
        success: false,
        url: args.websiteUrl,
        error: "Gumloop API configuration not found",
      };
    }

    try {
      // Step 1: Start the pipeline
      const startResult = await startPipeline(
        args.websiteUrl,
        apiKey,
        userId,
        savedItemId,
        focusArea
      );

      if (!startResult.run_id) {
        console.error("[fetchSEOAnalysis] FAILED: No run_id returned");
        return {
          success: false,
          url: args.websiteUrl,
          error: "Failed to start SEO pipeline",
        };
      }

      // Step 2: Poll until completion (max 3 minutes)
      const result = await pollUntilComplete(startResult.run_id, apiKey, userId, 180, 5);

      if (result.state === "FAILED") {
        console.log(`[fetchSEOAnalysis] FAILED: Pipeline failed`);
        return {
          success: false,
          url: args.websiteUrl,
          runId: startResult.run_id,
          error: result.error || "SEO analysis pipeline failed",
        };
      }

      if (result.state !== "DONE") {
        console.log(`[fetchSEOAnalysis] INCOMPLETE: Pipeline state: ${result.state}`);
        return {
          success: false,
          url: args.websiteUrl,
          runId: startResult.run_id,
          error: "SEO analysis did not complete in time",
        };
      }

      // Step 3: Extract markdown content
      const markdown = result.outputs?.output;

      if (!markdown || markdown.trim().length === 0) {
        console.log(`[fetchSEOAnalysis] WARNING: No markdown content in output`);
        return {
          success: false,
          url: args.websiteUrl,
          runId: startResult.run_id,
          error: "No SEO analysis content generated",
        };
      }

      console.log(`\n[fetchSEOAnalysis] SUCCESS Summary:`);
      console.log(`- Website: ${args.websiteUrl}`);
      console.log(`- Run ID: ${startResult.run_id}`);
      console.log(`- Markdown length: ${markdown.length} characters`);
      console.log(`- Credit cost: ${result.credit_cost || "N/A"}`);
      console.log(`========================================\n`);

      return {
        success: true,
        url: args.websiteUrl,
        runId: startResult.run_id,
        markdown,
      };
    } catch (error) {
      console.error("[fetchSEOAnalysis] ERROR:", error);
      return {
        success: false,
        url: args.websiteUrl,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
