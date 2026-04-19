# WebLeads HK — Claude Code Reference

## Project Overview
A B2B lead generation CRM dashboard for finding and managing local Hong Kong businesses that have no website — the target audience for web development services. Built with Next.js 14, TypeScript, Tailwind CSS, Supabase, and React Query.

## Tech Stack
- **Framework**: Next.js 14.2.14 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Database/Auth**: Supabase (PostgreSQL + Row Level Security)
- **State/Fetching**: TanStack React Query v5
- **Drag and Drop**: @hello-pangea/dnd (Kanban board)
- **Notifications**: Sonner (toast)
- **Date formatting**: date-fns

## Design System
- **Theme**: Dark brutalist / tech-mono aesthetic — black background, white text, white borders
- **Font**: Monospace (`font-mono`) everywhere — no serif or sans-serif
- **Typography pattern**: `text-[9px]` or `text-[10px]` labels in ALL CAPS with `tracking-widest`, larger `font-black` values for data
- **Borders**: `border border-white/20` for containers, `border-white/10` for subtle dividers
- **Hover states**: Use `hover:bg-white/5` NOT `hover:bg-zinc-50` — the app is dark-themed; zinc-50 is near-white and makes white text invisible
- **Active/selected state**: `bg-white text-black` (inverted)
- **NO rounded corners** anywhere — all `rounded-none`
- **Button pattern**: White fill with black text, hover inverts to transparent with white text and border
- **Color accents**: Only used for score tiers (red=HOT, amber=WARM, yellow=MID, zinc=COLD) and status badges
- **CSS variables**: `--background: 0 0% 0%` (black), `--foreground: 0 0% 100%` (white). Always use these via `bg-background` / `text-foreground`, never hardcode light colors

## File Structure
```
app/
  (auth)/login/          — Login page (Supabase auth)
  (dashboard)/
    layout.tsx           — Dashboard shell: Sidebar + StatsBar + main
    search/page.tsx      — Module 01: Target_Acquisition (Find Leads)
    leads/page.tsx       — Module 02: Database.Explorer (All Leads table)
    pipeline/page.tsx    — Module 03: Pipeline.Control (Kanban board)
    analytics/page.tsx   — Module 04: Intel.Dashboard (Analytics)
  api/
    scrape/route.ts      — POST /api/scrape — calls Google Places API

components/
  layout/
    Sidebar.tsx          — Left nav: Find Leads, All Leads, Pipeline, Analytics
    StatsBar.tsx         — Top bar: live stats (total, contacted, won, pipeline value, revenue)
  search/
    SearchForm.tsx       — Precision scan: business type + district dropdowns
    SearchResults.tsx    — Results grid with CAPTURE_ALL bulk button
    BusinessCard.tsx     — Individual business card with score badge + CAPTURE_LEAD
    MassScanPanel.tsx    — Mass scan mode: progress display, abort button
  leads/
    LeadsTable.tsx       — Table of all captured leads
    LeadRow.tsx          — Single table row with inline status change + score badge
    LeadFilters.tsx      — Filters: search, status, district, type, sort (includes LEAD_SCORE sort)
    LeadDetailModal.tsx  — Sheet sidebar: edit notes, deal value, status, audit timeline
  pipeline/
    KanbanBoard.tsx      — Drag-and-drop Kanban with 6 status columns
  ui/                    — shadcn/ui components (button, select, table, etc.)

lib/
  google-places.ts       — Google Places API (Text Search v1) integration
  scoring.ts             — Lead scoring algorithm (calcScore, scoreTier, TIER_STYLES)
  outscraper.ts          — Outscraper integration (NOT ACTIVE — no API key configured)
  supabase/
    client.ts            — Browser Supabase client
    server.ts            — Server-side Supabase client (for middleware/RSC)
  utils.ts               — cn() class merging utility

types/index.ts           — Lead, BusinessResult, LeadStatus, HK_DISTRICTS, BUSINESS_TYPES
middleware.ts            — Supabase auth middleware (protects /dashboard routes)
```

## Database Schema (Supabase `leads` table)
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| google_place_id | text | Unique — used for upsert deduplication |
| business_name | text | |
| business_type | text | Search term used to find it |
| district | text | HK district |
| full_address | text | |
| phone | text | |
| email | text | Not currently populated |
| google_maps_url | text | |
| google_rating | float | |
| google_review_count | int | |
| instagram_handle | text | Not currently populated |
| facebook_url | text | Not currently populated |
| has_website | boolean | `false` = primary lead target |
| website_url | text | null or social-only URL |
| status | LeadStatus | new/contacted/responded/meeting/won/lost/not_interested |
| notes | text | Free-form internal notes |
| contacted_at | timestamp | Set when status first moves from new |
| closed_at | timestamp | Set when status = won or lost |
| deal_value_hkd | int | Default 2000 |
| source | text | Always 'google_maps' currently |
| raw_data | jsonb | Full Google Places API response |
| created_at | timestamp | |
| updated_at | timestamp | |

## Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=        — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   — Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY=       — Supabase service role (server-side only)
GOOGLE_MAPS_API_KEY=             — Google Places API key (server-side only, never expose to client)
```
No `OUTSCRAPER_API_KEY` is configured — outscraper.ts is dormant.

## Key Business Logic

### Lead Scraping (Google Places)
- API: `https://places.googleapis.com/v1/places:searchText` (Places API v1, NOT v2 or legacy)
- Query format: `"{businessType} {district} Hong Kong"`
- Max 20 results per request
- `has_website` = false if `websiteUri` is null OR only points to social domains (facebook, instagram, linktr.ee, taplink, beacons.ai)
- SOCIAL_DOMAINS filter is in `lib/google-places.ts` — add to this list if more social platforms need filtering

### Duplicate Prevention
- All upserts use `{ onConflict: 'google_place_id' }` — safe to rescrape; will update not duplicate
- `existingPlaceIds` Set is fetched on page load and used to show ENTITY_STORED on BusinessCard

### Mass Scan Mode
- Categories: `['shop', 'restaurant', 'salon', 'clinic', 'store']` — 5 categories × 35 districts = 175 API calls
- Streams results live as each request completes (Map deduplication by `google_place_id`)
- Abort is handled via `useRef(false)` abort flag — not AbortController (simpler, sufficient)
- Progress state tracks: `{ current, total, district, category, found }`

### Lead Scoring (`lib/scoring.ts`)
Scores 0–100, higher = better opportunity:
- No website: +40 (primary signal)
- Reviews ≥100: +25, ≥50: +15, ≥20: +10, ≥5: +5
- Rating ≥4.5: +15, ≥4.0: +10, ≥3.5: +5
- Phone available: +15
- Address available: +5

Tiers: HOT ≥80, WARM ≥60, MID ≥40, COLD <40
Colors: HOT=red-400, WARM=amber-400, MID=yellow-600, COLD=zinc-600

### React Query Cache Keys
- `['leads']` — full leads list (LeadsPage + KanbanBoard invalidates this)
- `['leads-stats']` — stats bar counts
- `['leads-kanban']` — kanban board (separate from leads to avoid re-render)
- `['existing-place-ids']` — Set of already-captured place IDs (search page)
- `['leads-analytics']` — analytics page full leads

## Bugs Fixed (Do Not Reintroduce)

### 1. `cn` not defined in BusinessCard
**Problem**: `cn` was used at line 130 without being imported.
**Fix**: Added `import { cn } from '@/lib/utils'` to BusinessCard.tsx.
**Rule**: Always import `cn` from `@/lib/utils` before using it. It's not a global.

### 2. Table row hover white-on-white
**Problem**: `components/ui/table.tsx` had `hover:bg-zinc-50` on TableRow. Since all cell text is white (dark theme), hovering made text invisible.
**Fix**: Changed to `hover:bg-white/5` (subtle dark highlight). Also changed `border-black/10` to `border-white/10` to match dark theme.
**Rule**: Never use `hover:bg-zinc-50`, `hover:bg-white`, or any near-white hover background on rows/cards that contain white text. Use `hover:bg-white/5` or `hover:bg-zinc-900`.

### 3. LeadsTable empty state used light styling
The empty state in LeadsTable had `bg-white`, `text-gray-700`, emoji — clashes with dark theme. Noted but not breaking.

## Navigation Pages
| Route | Module Label | Description |
|---|---|---|
| /search | Module_01 / Target_Acquisition | Find and scrape leads |
| /leads | Module_02 / Database.Explorer | View/manage all leads |
| /pipeline | Module_03 / Pipeline.Control | Kanban drag-and-drop |
| /analytics | Module_04 / Intel.Dashboard | Stats and charts |

## Conventions
- All page headings use `text-4xl font-black text-white font-mono uppercase tracking-tighter`
- Section labels above headings: `text-[10px] text-zinc-600 font-mono tracking-[0.4em] uppercase` with text like `Module_01` or `Phase_02`
- Subtitles: `text-[10px] font-mono text-zinc-500 uppercase tracking-widest`
- Data labels above values: `text-[8px] or text-[9px] font-mono text-zinc-600 uppercase tracking-widest`
- All status updates call `queryClient.invalidateQueries` for both `['leads']` and `['leads-stats']`
- Google Places API key is server-side only — never import google-places.ts in client components
- `business_type` on mass-scanned leads will be the search category used (e.g., "shop", "restaurant") — this is expected

## What Is NOT Implemented
- Email outreach (no email field populated — Google Places doesn't return emails)
- Instagram/Facebook scraping (outscraper.ts exists but no API key)
- Pagination on leads table (loads all leads at once — fine for current scale)
- User accounts beyond single-user auth (no multi-tenancy)
- Mobile responsiveness (desktop-first)
