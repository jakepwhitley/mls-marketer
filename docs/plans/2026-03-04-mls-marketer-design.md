# MLS Marketer — Design Document
**Date:** 2026-03-04
**Status:** Approved

---

## Overview

A SaaS app where realtors upload MLS listing data (CSV or manual entry) and instantly receive AI-generated marketing content: a Facebook post, Instagram caption, LinkedIn post, newsletter paragraph, and a groupchat blurb for realtor networks. The goal is to reduce time and increase quality of marketing done by realtors.

---

## Architecture

### Stack
- **Framework:** Next.js 15 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **ORM:** Prisma 7 with `@prisma/adapter-pg`
- **Database:** Supabase (PostgreSQL + Storage)
- **Auth:** NextAuth v5 beta
- **AI:** Swappable via `AI_PROVIDER` env var (`anthropic` | `openai`), defaulting to Claude

### AI Abstraction Layer
Single module at `src/lib/ai/generate.ts` exposing:
```ts
generateListingContent(listing: Listing, provider?: AIProvider): Promise<GeneratedContent>
```
Each provider implements the same interface. Swapping providers requires only changing the env var.

### Core Data Flow
```
Realtor → Upload CSV or Fill Form
         ↓
   Parse & store Listing record
         ↓
   AI provider generates 5 content pieces
         ↓
   GeneratedContent record saved to DB
         ↓
   Results page — copy, edit, regenerate
```

---

## Database Schema

### Tables

**User**
- `id`, `email`, `name`, `image`
- `subscriptionStatus`: enum `free | pro | agency` (stubbed — no Stripe yet)
- `stylePreference`: enum `professional | friendly | luxury | first_time_buyer`
- `createdAt`, `updatedAt`

**Listing**
- `id`, `userId` (FK)
- `address`, `city`, `state`, `zip`
- `listPrice`, `beds`, `baths`, `sqft`, `yearBuilt`, `propertyType`
- `description` (public remarks)
- `rawData`: JSON (full parsed CSV row or form data)
- `createdAt`

**GeneratedContent**
- `id`, `listingId` (FK)
- `facebook`, `instagram`, `linkedin`, `newsletter`, `groupchat`: Text fields
- `provider`: string (which AI model was used)
- `createdAt`

### Subscription Stubs
- `User.subscriptionStatus` field exists
- Free tier: 10 listings/month (enforced in app logic)
- Pro/Agency tiers: unlimited (logic stubbed, UI shows "Upgrade" button)
- No Stripe integration yet — designed to be added later

---

## Pages & Routes

### Public (unauthenticated)
| Route | Description |
|-------|-------------|
| `/` | Landing page: hero, features, pricing tiers, CTA |
| `/auth/signin` | Sign in |
| `/auth/signup` | Sign up |

### App (authenticated)
| Route | Description |
|-------|-------------|
| `/dashboard` | Recent listings, usage meter, quick "New Listing" CTA |
| `/listings` | Table of all listings with date, status, quick-copy |
| `/listings/new` | Two tabs: "Upload CSV" and "Enter Manually" + Generate button |
| `/listings/[id]` | Results page: 5 content cards |
| `/settings` | Profile, style preference, subscription status |

---

## Content Output Specs

| Card | Platform | Target Length | Tone Notes |
|------|----------|--------------|------------|
| Facebook | Facebook | 150–250 words | Storytelling, community feel |
| Instagram | Instagram | 80–120 words + 10 hashtags | Visual, punchy |
| LinkedIn | LinkedIn | 100–150 words | Professional, market-aware |
| Newsletter | Email newsletter | 60–80 words | Fits into a larger newsletter, concise |
| Groupchat | Realtor network chat | 2–3 sentences | Key facts only, no fluff |

Each card on the results page has:
- Copy button (turns green ✓ for 2 seconds)
- Inline edit (contenteditable or textarea toggle)
- Regenerate button (re-calls AI for that card only)

---

## CSV Parsing

### Field Mapping Strategy
Standard MLS column names to try per field (case-insensitive):

| Field | Column aliases |
|-------|---------------|
| Address | `Address`, `Street Address`, `Full Address` |
| List Price | `List Price`, `Price`, `Listing Price` |
| Beds | `Beds`, `Bedrooms`, `BR` |
| Baths | `Baths`, `Bathrooms`, `Full Baths` |
| Sqft | `Sqft`, `Square Feet`, `Living Area` |
| Property Type | `Type`, `Property Type`, `Style` |
| Year Built | `Year Built`, `YrBuilt` |
| Description | `Remarks`, `Public Remarks`, `Description` |
| City | `City` |
| State | `State` |
| Zip | `Zip`, `Postal Code` |

### Unmapped Fields UI
If unrecognized column names are found, show a column-mapping step before generation so realtors can manually match their MLS's column names. Mapping is saved per user for future uploads.

---

## UI Design System

### Color Palette
| Role | Color | Hex |
|------|-------|-----|
| Primary | blue-600 | `#2563EB` |
| Primary hover | blue-700 | `#1D4ED8` |
| Accent light | blue-50 | `#EFF6FF` |
| Page background | slate-50 | `#F8FAFC` |
| Card background | white | `#FFFFFF` |
| Text primary | slate-900 | `#0F172A` |
| Text secondary | slate-500 | `#64748B` |
| Border | blue-100 | `#DBEAFE` |

### Content Card Platform Colors (left border accent)
| Platform | Color |
|----------|-------|
| Facebook | blue-600 |
| Instagram | pink-500 |
| LinkedIn | sky-600 |
| Newsletter | indigo-500 |
| Groupchat | slate-500 |

### Layout
- Sidebar navigation (collapsible on mobile), logo top, user avatar + settings bottom
- Max content width: `1200px`
- Cards: `border border-blue-100`, soft shadow, `rounded-xl`
- Primary CTA: blue-600 fill, white text, rounded
- Dashboard: 2-column stat cards + recent listings table

---

## Future Considerations (Out of Scope Now)
- Stripe subscription billing (Pro + Agency tiers)
- Agency accounts managing multiple agent sub-accounts
- Photo upload to Supabase Storage for listing images
- Scheduled social post publishing via Buffer/Hootsuite API
- Saved tone/style templates per realtor
- Bulk CSV generation (process multiple listings at once)
- Step-by-step wizard mode for power users
