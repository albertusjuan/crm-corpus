# WebLeads HK — Dashboard Technical Prompt



---

## Project Overview

Build a full-stack web dashboard called **WebLeads HK** — a personal CRM tool for a web designer to find and track local Hong Kong businesses that have no website, and manage outreach to them as potential clients.

**Core user story**: As a solo web designer, I want to search for local Hong Kong shops, cafés, and restaurants that don't have a website yet, add them to my prospect list, and track whether I've contacted them, whether they responded, and whether I closed the deal.

---

## Tech Stack

- **Framework**: Next.js 14 with App Router and TypeScript
- **Backend / Database**: Supabase (free tier) — PostgreSQL + Auth + Realtime
- **Hosting**: Vercel (free Hobby tier)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Data Fetching**: TanStack Query (React Query) v5
- **Icons**: Lucide React

---

## Third-Party APIs

### 1. Outscraper (Google Maps Scraper)
- **Purpose**: Search for businesses in Hong Kong by type and district, returns name, address, phone, website URL, rating, review count, Instagram, and Google Maps URL
- **How to use**: `GET https://api.app.outscraper.com/maps/search?query={query}&limit=20&async=false` with header `X-API-KEY: {key}`
- **Free tier**: 25 free requests on signup
- **Sign up**: outscraper.com
- **Key env var**: `OUTSCRAPER_API_KEY`

### 2. Supabase
- **Purpose**: Store all leads, track outreach status, authenticate the user
- **Free tier**: 500MB database, unlimited API calls
- **Key env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Database Schema (Supabase / PostgreSQL)

Run these SQL statements in the Supabase SQL editor:

```sql
-- LEADS table: one row per business prospect
CREATE TABLE leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  -- Business info
  google_place_id     TEXT NOT NULL,
  business_name       TEXT NOT NULL,
  business_type       TEXT,
  district            TEXT,
  full_address        TEXT,
  phone               TEXT,
  email               TEXT,
  google_maps_url     TEXT,
  google_rating       DECIMAL(2,1),
  google_review_count INTEGER,

  -- Social
  instagram_handle    TEXT,
  facebook_url        TEXT,

  -- Website status (the key qualifier)
  has_website         BOOLEAN DEFAULT FALSE,
  website_url         TEXT,

  -- CRM tracking
  status              TEXT DEFAULT 'new',
  -- Values: 'new' | 'contacted' | 'responded' | 'meeting' | 'won' | 'lost' | 'not_interested'

  notes               TEXT,
  contacted_at        TIMESTAMPTZ,
  closed_at           TIMESTAMPTZ,
  deal_value_hkd      INTEGER DEFAULT 2000,

  -- Source tracking
  source              TEXT DEFAULT 'outscraper',
  raw_data            JSONB,

  CONSTRAINT leads_google_place_id_key UNIQUE (google_place_id)
);

-- INDEX for fast filtering
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_google_place_id ON leads(google_place_id);
CREATE INDEX idx_leads_district ON leads(district);
CREATE INDEX idx_leads_business_type ON leads(business_type);
CREATE INDEX idx_leads_has_website ON leads(has_website);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (solo user app)
CREATE POLICY "Authenticated users can do everything"
ON leads FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

## Application Structure

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx          # Simple email+password login via Supabase Auth
├── (dashboard)/
│   ├── layout.tsx            # Sidebar navigation layout
│   ├── page.tsx              # Redirect to /search
│   ├── search/
│   │   └── page.tsx          # MAIN PAGE: search + scrape + add leads
│   ├── leads/
│   │   └── page.tsx          # All leads table with filters and status tracking
│   └── pipeline/
│       └── page.tsx          # Kanban board: New → Contacted → Responded → Won/Lost
├── api/
│   └── scrape/
│       └── route.ts          # Server-side proxy to Outscraper API
└── middleware.ts              # Protect dashboard routes, redirect to login if not authed

components/
├── search/
│   ├── SearchForm.tsx         # District + business type dropdowns + search button
│   ├── SearchResults.tsx      # Grid of business cards from Outscraper
│   └── BusinessCard.tsx       # Individual result with "Add to leads" button
├── leads/
│   ├── LeadsTable.tsx         # Sortable, filterable table of all leads
│   ├── LeadRow.tsx            # Single row with inline status change dropdown
│   ├── LeadFilters.tsx        # Filter bar: status, district, business type
│   └── LeadDetailModal.tsx    # Side drawer with full lead info + notes editor
├── pipeline/
│   └── KanbanBoard.tsx        # Drag-and-drop kanban using @hello-pangea/dnd
├── layout/
│   ├── Sidebar.tsx            # Navigation: Search, Leads, Pipeline
│   └── StatsBar.tsx           # Top bar: total leads, contacted, won, revenue
└── ui/                        # shadcn/ui components (Button, Badge, Input, etc.)

lib/
├── supabase/
│   ├── client.ts              # Browser Supabase client
│   └── server.ts              # Server Supabase client (for API routes)
├── outscraper.ts              # Outscraper API wrapper function
└── constants.ts               # HK districts list, business types list

types/
└── index.ts                   # Lead type, SearchResult type, Status enum
```

---

## Page-by-Page Specification

---

### Page 1: `/search` — Find New Leads

**Purpose**: Search Google Maps via Outscraper for businesses without websites, then add them to the leads database.

**Layout**:
- Top section: Search form
- Below: Grid of results (or empty state)

**Search Form (`SearchForm.tsx`)**:

Inputs:
1. **Business Type** — dropdown with these options:
   - café, coffee shop, restaurant, bakery, florist, hair salon, nail salon, boutique, gift shop, bookstore, yoga studio, gym, pet shop, dry cleaning, pharmacy

2. **District** — dropdown with these HK districts:
   - Central, Sheung Wan, Sai Ying Pun, Kennedy Town, Admiralty, Wan Chai, Causeway Bay, Happy Valley, North Point, Quarry Bay, Tai Koo, Sai Wan Ho, Shau Kei Wan, Chai Wan, Aberdeen, Stanley, Mong Kok, Yau Ma Tei, Jordan, Tsim Sha Tsui, Hung Hom, To Kwa Wan, Sham Shui Po, Cheung Sha Wan, Lai Chi Kok, Kwun Tong, Ngau Tau Kok, Kowloon Bay, Diamond Hill, Wong Tai Sin, Sha Tin, Tai Po, Tuen Mun, Yuen Long, Fanling

3. **Search button** — triggers API call

On submit, call `POST /api/scrape` with `{ businessType, district }`.

**Results Display (`SearchResults.tsx`)**:

Show results in a responsive grid (3 columns desktop, 1 column mobile).

For each result, show a `BusinessCard.tsx` with:
- Business name (large)
- Type badge + District badge
- Address
- ⭐ Google rating + review count
- 📸 Instagram handle (if found) — shown as `@handle` in purple
- 🌐 Website status — show green "Has Website" badge if they have one, red "No Website" badge if not
- Phone number
- **"Add to Leads" button** — disabled and shows "Already Added" if this business is already in the `leads` table (check by `google_place_id`)
- Clicking "Add to Leads" writes to Supabase using `upsert(..., { onConflict: 'google_place_id' })` so duplicate leads are never created

**Important filtering logic**: By default, automatically filter OUT results that have a real website (i.e. `has_website = true`). Add a toggle "Show businesses with websites too" so the user can see all results if they want. This means the default view only shows no-website businesses. Deduplication must always use `google_place_id`, not `business_name + district`.

**Loading state**: Show skeleton cards while fetching.

**Empty state**: "No results found. Try a different district or business type."

---

### Page 2: `/leads` — Manage All Leads

**Purpose**: See all added leads in a table, update their status, add notes, and track progress.

**Layout**:
- Filter bar at top
- Table below

**Filter Bar (`LeadFilters.tsx`)**:
- Search input: filter by business name (client-side)
- Status filter: All | New | Contacted | Responded | Meeting | Won | Lost
- District filter: dropdown of all districts
- Business Type filter: dropdown of all types
- Sort by: Date Added | Business Name | Status | District

**Leads Table (`LeadsTable.tsx`)**:

Columns:
1. **Business Name** — clickable, opens `LeadDetailModal`
2. **Type** — badge
3. **District** — text
4. **Contact** — phone number + Instagram handle (if available)
5. **Google** — rating stars + review count
6. **Website** — "No Website" red badge or "Has Website" green badge
7. **Status** — inline editable dropdown with these options and colours:
   - 🔵 New
   - 🟡 Contacted
   - 🟠 Responded
   - 🟣 Meeting Booked
   - 🟢 Won
   - 🔴 Lost
   - ⚫ Not Interested
8. **Date Added** — relative time (e.g. "3 days ago")
9. **Actions** — icon buttons: Edit notes, Open Google Maps, Open Instagram, Delete

When status is changed inline, update Supabase immediately and show a toast notification.

**Lead Detail Modal / Drawer (`LeadDetailModal.tsx`)**:

Right-side drawer that slides in when a lead row is clicked. Contains:
- Business name as header
- All business details (address, phone, email, website, Instagram, Facebook, Google Maps link)
- Google rating and review count
- **Status selector** — large buttons for each status
- **Notes text area** — free text, auto-saved to Supabase on blur
- **Contacted date** — date picker, set when status changes to "Contacted"
- **Deal value** — editable field, defaults to HK$2,000
- **Timeline** — simple list of: "Added on X", "Contacted on X", "Status changed to X on X"
- **Delete button** at bottom (with confirmation)

---

### Page 3: `/pipeline` — Kanban Board

**Purpose**: Visual overview of where every lead is in the sales process.

**Columns** (left to right):
1. 🔵 **New** — just added, not contacted yet
2. 🟡 **Contacted** — sent WhatsApp/email/DM
3. 🟠 **Responded** — they replied
4. 🟣 **Meeting** — meeting booked
5. 🟢 **Won** — deal closed
6. 🔴 **Lost / Not Interested**

Each column shows:
- Column name + count of leads in it
- Scrollable list of lead cards

Each lead card in kanban shows:
- Business name
- District + type
- Instagram handle (if available)
- Days since added
- Drag handle to move between columns

Dragging a card between columns updates the `status` field in Supabase in real time.

**Use `@hello-pangea/dnd`** for drag and drop (it's the maintained fork of react-beautiful-dnd).

---

### Stats Bar (`StatsBar.tsx`)

Shown at the top of every dashboard page. Shows:
- **Total Leads**: count of all rows in `leads`
- **Contacted**: count where status != 'new'
- **Won**: count where status = 'won'
- **Pipeline Value**: count of non-won, non-lost leads × HK$2,000
- **Revenue Closed**: count of won leads × HK$2,000

---

### Sidebar Navigation (`Sidebar.tsx`)

Items:
- 🔍 Find Leads → `/search`
- 📋 All Leads → `/leads`
- 📊 Pipeline → `/pipeline`
- Bottom: User email + Logout button

---

## API Route Specification

### `POST /api/scrape`

```typescript
// Request body
{
  businessType: string   // e.g. "cafe"
  district: string       // e.g. "Mong Kok"
}

// What the route does:
// 1. Construct query: `${businessType} ${district} Hong Kong`
// 2. Call Outscraper API
// 3. For each result, determine has_website:
//    - has_website = true if result.website exists AND
//      does NOT include facebook.com, instagram.com, linktr.ee, taplink.cc
// 4. Return array of normalised BusinessResult objects

// Response body
{
  results: BusinessResult[]
  total: number
  noWebsiteCount: number
}

// BusinessResult type
{
  business_name: string
  business_type: string
  district: string
  full_address: string
  phone: string | null
  google_maps_url: string | null
  google_rating: number | null
  google_review_count: number | null
  instagram_handle: string | null
  facebook_url: string | null
  has_website: boolean
  website_url: string | null
  raw_data: object
}
```

---

## Types

```typescript
// types/index.ts

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'responded'
  | 'meeting'
  | 'won'
  | 'lost'
  | 'not_interested'

export interface Lead {
  id: string
  created_at: string
  updated_at: string
  google_place_id: string
  google_place_id: string
  business_name: string
  business_type: string | null
  district: string | null
  full_address: string | null
  phone: string | null
  email: string | null
  google_maps_url: string | null
  google_rating: number | null
  google_review_count: number | null
  instagram_handle: string | null
  facebook_url: string | null
  has_website: boolean
  website_url: string | null
  status: LeadStatus
  notes: string | null
  contacted_at: string | null
  closed_at: string | null
  deal_value_hkd: number
  source: string
  raw_data: Record<string, unknown> | null
}

export interface BusinessResult {
  business_name: string
  business_type: string | null
  district: string
  full_address: string | null
  phone: string | null
  google_maps_url: string | null
  google_rating: number | null
  google_review_count: number | null
  instagram_handle: string | null
  facebook_url: string | null
  has_website: boolean
  website_url: string | null
  raw_data: Record<string, unknown>
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  responded: 'Responded',
  meeting: 'Meeting Booked',
  won: 'Won',
  lost: 'Lost',
  not_interested: 'Not Interested'
}

export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  responded: 'bg-orange-100 text-orange-800',
  meeting: 'bg-purple-100 text-purple-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
  not_interested: 'bg-gray-100 text-gray-800'
}

export const HK_DISTRICTS = [
  'Central', 'Sheung Wan', 'Sai Ying Pun', 'Kennedy Town',
  'Admiralty', 'Wan Chai', 'Causeway Bay', 'Happy Valley',
  'North Point', 'Quarry Bay', 'Tai Koo', 'Sai Wan Ho',
  'Shau Kei Wan', 'Chai Wan', 'Aberdeen', 'Stanley',
  'Mong Kok', 'Yau Ma Tei', 'Jordan', 'Tsim Sha Tsui',
  'Hung Hom', 'To Kwa Wan', 'Sham Shui Po', 'Cheung Sha Wan',
  'Lai Chi Kok', 'Kwun Tong', 'Ngau Tau Kok', 'Kowloon Bay',
  'Diamond Hill', 'Wong Tai Sin', 'Sha Tin', 'Tai Po',
  'Tuen Mun', 'Yuen Long', 'Fanling'
] as const

export const BUSINESS_TYPES = [
  'café', 'coffee shop', 'restaurant', 'bakery', 'florist',
  'hair salon', 'nail salon', 'boutique', 'gift shop',
  'bookstore', 'yoga studio', 'gym', 'pet shop',
  'dry cleaning', 'pharmacy'
] as const
```

---

## Key Implementation Details

### Supabase Client Setup

```typescript
// lib/supabase/client.ts — use in Client Components
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// lib/supabase/server.ts — use in Server Components and API routes
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        }
      }
    }
  )
}
```

### Middleware (Route Protection)

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll() },
                 setAll(s) { s.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)']
}
```

### Outscraper API Wrapper

```typescript
// lib/outscraper.ts
export async function scrapeGoogleMaps(businessType: string, district: string) {
  const query = `${businessType} ${district} Hong Kong`

  const response = await fetch(
    `https://api.app.outscraper.com/maps/search?query=${encodeURIComponent(query)}&limit=20&async=false`,
    {
      headers: {
        'X-API-KEY': process.env.OUTSCRAPER_API_KEY!,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) throw new Error(`Outscraper error: ${response.statusText}`)

  const data = await response.json()
  const results = data?.data?.[0] ?? []

  const SOCIAL_DOMAINS = ['facebook.com', 'instagram.com', 'linktr.ee', 'taplink.cc', 'beacons.ai']

  return results.map((r: Record<string, unknown>) => {
    const websiteUrl = r.site as string | null
    const hasRealWebsite = !!websiteUrl && !SOCIAL_DOMAINS.some(d => websiteUrl.includes(d))

    return {
      google_place_id: (r.place_id as string) ?? (r.cid as string) ?? (r.google_id as string) ?? '',
      business_name: r.name as string,
      business_type: businessType,
      district,
      full_address: r.full_address as string ?? null,
      phone: r.phone as string ?? null,
      google_maps_url: r.url as string ?? null,
      google_rating: r.rating as number ?? null,
      google_review_count: r.reviews as number ?? null,
      instagram_handle: (r.instagram as string)?.replace('@', '') ?? null,
      facebook_url: r.facebook as string ?? null,
      has_website: hasRealWebsite,
      website_url: websiteUrl,
      raw_data: r
    }
  })
}
```

---

## UI Design Guidelines

- **Color scheme**: Dark sidebar (`#0f172a` slate-900), white main content area
- **Font**: Use `Geist` (default in Next.js 14) or `Inter`
- **Accent color**: Blue (`#3b82f6`) for primary actions
- **Status badges**: Use the `STATUS_COLORS` map for consistent colouring
- **Cards**: White background, subtle shadow, `rounded-xl`, `border border-gray-100`
- **Table rows**: Hover state `bg-gray-50`, selected state `bg-blue-50`
- **No Website badge**: Red background `bg-red-100 text-red-700` with a ❌ or 🚫 icon
- **Has Website badge**: Green background `bg-green-100 text-green-700` with ✅ icon
- **Toast notifications**: Use `sonner` library for non-intrusive toasts on status changes and lead additions

---

## Packages to Install

```bash
npx create-next-app@latest webleads-hk --typescript --tailwind --app --src-dir=false

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# UI Components
npx shadcn@latest init
npx shadcn@latest add button badge input select dialog sheet table dropdown-menu toast

# Utilities
npm install @tanstack/react-query
npm install @hello-pangea/dnd          # Kanban drag and drop
npm install sonner                     # Toast notifications
npm install date-fns                   # Relative time formatting
npm install lucide-react               # Icons (already in shadcn)
```

---

## Environment Variables

```bash
# .env.local

# Supabase (get from supabase.com → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Outscraper (get from outscraper.com → Profile → API Key)
OUTSCRAPER_API_KEY=your-outscraper-api-key
```

---

## Setup Steps (In Order)

1. Run `npx create-next-app@latest webleads-hk --typescript --tailwind --app`
2. Create a Supabase project at supabase.com (free tier)
3. Run the SQL schema above in Supabase SQL Editor
4. Enable Email Auth in Supabase → Authentication → Providers
5. Create your user account in Supabase → Authentication → Users → Add User
6. Sign up for Outscraper at outscraper.com (25 free credits on signup)
7. Copy `.env.local` with your real keys
8. Install all packages listed above
9. Build in this order: types → lib/supabase → lib/outscraper → middleware → login page → layout → search page → leads page → pipeline page
10. When saving leads, always use `upsert` with `onConflict: 'google_place_id'` to prevent duplicate businesses from being created

---

## What This Does NOT Include (Keep It Simple)

- ❌ No multi-user support (just you, one login)
- ❌ No email/WhatsApp sending (you do outreach manually, just track it here)
- ❌ No AI features
- ❌ No complex scoring algorithm (the Outscraper data + your eyes is enough)
- ❌ No mobile app
- ❌ No payment integration
- ❌ No automated scraping schedules (you click search when you need leads)

This is a focused, personal tool. Build only what's described above.
