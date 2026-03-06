# Platform Mock UI Design
**Date:** 2026-03-06
**Status:** Approved

## Overview

Replace the generic `ContentCard` components on the listing results page with dedicated platform-specific mock UIs. Each platform's generated content is displayed inside a styled replica of that platform's real post format, making the results page feel like a social media feed.

## Approach

Dedicated component per platform (Approach A). Each platform looks different enough that shared structure would fight the goal. 5 standalone client components, each built to match that platform's real UI chrome.

## Component Architecture

### File Structure
```
components/listings/platform-mocks/
  facebook-post.tsx
  instagram-post.tsx
  linkedin-post.tsx
  newsletter-block.tsx
  groupchat-bubble.tsx
```

### Shared Props Interface
Each component receives:
- `content: string` — AI-generated text for that platform
- `userName: string` — realtor's display name (from session)
- `userInitials: string` — derived from name for avatar

The listing page (`app/(app)/listings/[id]/page.tsx`) passes `session.user.name` (already available via `auth()`) to each component.

### Edit/Copy Toolbar
Below each platform mock sits a slim utility bar with **Edit** and **Copy** buttons. Clicking Edit replaces the mock with an inline textarea; saving switches back to the styled mock view. This keeps the mock chrome clean while preserving the edit/copy workflow from the original `ContentCard`.

## Visual Design

### Facebook
- White card on light gray background
- Top row: circular avatar (initials) + realtor name bold + "Just now · 🌐"
- Post body text
- Gray photo placeholder with 🏠 icon
- Reaction row: 👍❤️ "24 people reacted"
- Divider + Like · Comment · Share footer buttons

### Instagram
- White card
- Top: circular avatar + @username (name lowercased, spaces removed) + "···" button
- Square gray photo placeholder with 🏠 icon
- Icon row: ♥ 💬 ✈️ (left), 🔖 (right)
- "47 likes" bold
- **username** bold + caption inline; hashtags in blue
- "2 HOURS AGO" small gray caps

### LinkedIn
- White card
- Top: avatar + name bold + "Real Estate Professional · 1st" + timestamp + Follow button
- Post body text
- "👍 ❤️ 18 · 4 comments" small gray
- Divider + Like · Comment · Repost · Send action bar

### Newsletter
- Outer light gray background, inner white email body (~600px max-width, centered)
- Blue header bar: "📬 Market Update"
- White content area with newsletter paragraph
- Light gray footer: "Unsubscribe · View in browser · Sent with ❤️ from [Name]"

### Groupchat
- Dark charcoal background (#1c1c1e)
- Header: "Realtor Network 🏠" with 3 stacked small avatar circles
- Single incoming gray bubble (left-aligned, rounded corners) with message text
- Timestamp below bubble in small gray
- "Delivered" in tiny text bottom right

## Data Flow

```
ListingPage (server)
  └── auth() → session.user.name
  └── prisma.listing.findFirst() → listing + generatedContent
  └── renders FacebookPost, InstagramPost, LinkedInPost, NewsletterBlock, GroupchatBubble
        each receives: content (from generatedContent), userName, userInitials
```

## What Changes

- `app/(app)/listings/[id]/page.tsx` — replace CARDS loop + ContentCard with 5 specific platform components
- `components/listings/content-card.tsx` — no longer used on listing results page (can be kept for potential future use)
- 5 new files under `components/listings/platform-mocks/`
