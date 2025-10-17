# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Web Refresh, a landing page specification generator built with Convex and React. It's an application where users enter their business name and receive a comprehensive, editable landing page specification document with integrated SEO analysis, customer reviews, and website content.

**Core Flow:**
1. User enters their business name on the landing page
2. System looks up business info (Google Places) and fetches website URL
3. System automatically generates a comprehensive landing page spec by:
   - Fetching and formatting Google reviews
   - Scraping existing website content (via Firecrawl)
   - Running SEO analysis (via Gumloop)
   - Populating a detailed landing page specification template
4. User can view the spec in the document panel and chat to request updates
5. User can manually edit and export the final specification

## Development Commands

### Running the Application
- `npm install` - Install all dependencies (required first-time setup)
- `npm run dev` - Start both frontend (Vite) and backend (Convex) in parallel
  - Frontend runs at: http://localhost:5173/
  - Convex dashboard: https://dashboard.convex.dev/d/keen-warbler-83
- `npm run dev:frontend` - Start only the Vite dev server
- `npm run dev:backend` - Start only Convex dev (connects to `CONVEX_DEPLOYMENT` in `.env.local`)

### Building and Validation
- `npm run build` - Build the frontend for production
- `npm run lint` - Run comprehensive lint check (TypeScript check for both Convex and frontend, Convex validation, and Vite build)

### Convex-Specific Commands
- `npx convex dev` - Connect to Convex dev environment
- `npx convex deploy` - Deploy backend to production

## Architecture

### Backend (Convex)

**Database Schema** (convex/schema.ts):
- `conversations` - Stores chat history with messages array
- `documents` - Website spec documents, one per conversation
- Auth tables from `@convex-dev/auth` for anonymous authentication

**Key Backend Files:**
- `convex/conversations.ts` - CRUD operations for conversations and messages
- `convex/documents.ts` - CRUD operations for specification documents
- `convex/ai.ts` - The core action that generates/updates specs using a template
  - Uses a comprehensive landing page specification template from `convex/specTemplate.ts`
  - No AI/LLM calls - template-based generation with data population
  - Detects if updating existing spec vs creating new one
- `convex/auth.ts` & `convex/auth.config.ts` - Anonymous auth via Convex Auth
- `convex/http.ts` & `convex/router.ts` - HTTP routing (auth routes in http.ts should not be modified)

**Important Pattern:** The spec generation action (`generateWebsiteSpec`) orchestrates the full flow:
1. Fetches conversation context
2. Fetches external data in parallel (reviews, website content, SEO analysis)
3. Checks for existing document
4. For new specs: Formats the external data and populates the template with:
   - `{CUSTOMER_REVIEWS}` - Formatted Google reviews with ratings and links
   - `{SEO_REPORT}` - SEO analysis markdown from Gumloop
   - `{WEBSITE_CONTENT}` - Scraped website content from Firecrawl
5. For updates: Appends update note to existing content
6. Adds assistant message to conversation
7. Creates or updates the document

### Frontend (React + Vite)

**Component Architecture:**
- `src/App.tsx` - Main layout with header, view state management (landing vs chat), and authenticated/unauthenticated views
- `src/components/BusinessNamePage.tsx` - Landing page with centered business name input
- `src/components/ChatPanel.tsx` - Left panel: conversation list + chat interface (accepts businessContext prop)
- `src/components/DocumentPanel.tsx` - Right panel: editable document viewer
- Layout uses CSS Grid (50/50 split) with full-height viewport strategy for chat view

**State Management:**
- Uses Convex React hooks (`useQuery`, `useMutation`, `useAction`)
- Shared state: `selectedConversationId` flows from App → ChatPanel & DocumentPanel
- Real-time updates via Convex subscriptions

**Styling:**
- Tailwind CSS with custom theme in `tailwind.config.js`
- Custom colors: `primary` (#2563eb), `secondary` (#64748b)
- Global styles in `src/index.css` including full-height layout setup
- Auth-specific classes: `.auth-input-field`, `.auth-button` (only for auth forms)

### Full-Height Layout Strategy

**Critical for UI layout:** The app uses a specific pattern to fill the viewport:
```css
/* In src/index.css */
html, body, #root {
  height: 100%;
}
```
```jsx
/* In src/App.tsx */
<div className="h-full flex flex-col">  /* Not min-h-screen */
  <main className="flex-1 overflow-hidden">
    <Content />  /* Also uses h-full */
  </main>
</div>
```

This ensures ChatPanel and DocumentPanel take full viewport height without squashing to the top.

## Key Integration Points

### Convex + OpenAI Integration
The app uses Convex's built-in OpenAI integration (not a direct OpenAI client):
- API key stored as Convex environment variable
- Configured via `CONVEX_OPENAI_BASE_URL` and `CONVEX_OPENAI_API_KEY`
- Model: `gpt-4o-mini` with temperature 0.7, max_tokens 3000

### Firecrawl Integration
The app uses Firecrawl to scrape existing website content in parallel with Google Reviews:
- Uses Firecrawl v2 API with raw `fetch` calls (not SDK)
- Endpoints: `/v2/map` (get all URLs) and `/v2/scrape` (extract markdown)
- API key stored as Convex environment variable: `FIRECRAWL_API_KEY`
- Flow: Scrape homepage → Filter links by keywords → Parallel scrape top pages → Append to spec
- Key files:
  - `convex/firecrawl.ts` - Scrape and filter actions
  - `convex/ai.ts` - Orchestrates parallel data fetching

### Gumloop SEO Integration
The app uses Gumloop to generate SEO analysis for the website:
- Uses Gumloop API with raw `fetch` calls
- Flow: Start pipeline → Poll for completion (max 3 minutes) → Extract markdown → Append to spec
- Runs in parallel with reviews and website scraping
- Focus area: Content Optimization (Hero, Services, Header, Meta, FAQ, CTAs, etc.)
- API credentials stored as Convex environment variables
- Key files:
  - `convex/seo.ts` - Gumloop API integration and polling logic
  - `convex/ai.ts` - Orchestrates parallel data fetching

### Document-Conversation Relationship
- One conversation → One document (1:1 relationship)
- Documents are linked via `conversationId`
- When user sends first message: creates conversation → generates spec → creates document
- Subsequent messages: updates existing document

## Authentication

Uses Convex Auth with anonymous authentication:
- No email/password required
- Users auto-authenticated on first visit
- All queries/mutations check `getAuthUserId(ctx)`
- Auth configuration in `convex/auth.config.ts`

## Environment Configuration

Required environment variables in `.env.local`:
- `CONVEX_DEPLOYMENT` - Convex deployment identifier (e.g., "dev:keen-warbler-83")
- `VITE_CONVEX_URL` - Convex cloud URL (e.g., "https://keen-warbler-83.convex.cloud")

Backend environment variables (set in Convex dashboard):
- `CONVEX_OPENAI_BASE_URL` - OpenAI API base URL
- `CONVEX_OPENAI_API_KEY` - OpenAI API key for spec generation
- `OPENAI_API_KEY` - OpenAI API key for URL filtering
- `GOOGLE_PLACES_API_KEY` - Google Places API key for reviews
- `FIRECRAWL_API_KEY` - Firecrawl API key for website scraping
- `GUMLOOP_API_KEY` - Gumloop API key for SEO analysis
- `GUMLOOP_USER_ID` - Gumloop user ID
- `GUMLOOP_SAVED_ITEM_ID` - Gumloop pipeline ID for SEO analysis
- `GUMLOOP_FOCUS_AREA` - SEO analysis focus area (optional, defaults to content optimization)

## Important Notes

- **Do not modify** `convex/http.ts` auth routes - user HTTP routes go in `convex/router.ts`
- The Vite config includes Chef-specific dev tooling for screenshot functionality during development
- TypeScript configurations are split: `tsconfig.json` (frontend) and `convex/tsconfig.json` (backend)
- Toaster notifications use `sonner` library for user feedback
