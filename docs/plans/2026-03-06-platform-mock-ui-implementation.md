# Platform Mock UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace generic content cards on the listing results page with platform-specific mock UIs (Facebook, Instagram, LinkedIn, Newsletter, Groupchat) that look like real posts when scrolling.

**Architecture:** 5 dedicated presentational components under `components/listings/platform-mocks/`, each rendering a styled replica of that platform's UI. A shared `MockPostShell` wrapper handles edit/copy state so platform components stay purely visual. The listing page passes `userName` and `userInitials` from `session.user.name`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, TypeScript

---

### Task 1: Create MockPostShell — shared wrapper for edit/copy state

**Files:**
- Create: `components/listings/platform-mocks/mock-post-shell.tsx`

`MockPostShell` manages `editing`, `editedContent`, and `copied` state. When not editing it renders `children(editedContent)` (a render prop). When editing it shows a textarea. Below the mock it always renders the Edit/Copy toolbar.

**Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Copy, Check, Pencil, X } from 'lucide-react'

interface MockPostShellProps {
  content: string
  label: string
  children: (text: string) => React.ReactNode
}

export function MockPostShell({ content, label, children }: MockPostShellProps) {
  const [editing, setEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(editedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 pl-1">{label}</p>

      {editing ? (
        <Textarea
          value={editedContent}
          onChange={e => setEditedContent(e.target.value)}
          className="min-h-[160px] text-sm border-blue-200 focus-visible:ring-blue-500"
        />
      ) : (
        children(editedContent)
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-slate-600 h-7 px-2 text-xs"
          onClick={() => setEditing(!editing)}
        >
          {editing ? <><X className="w-3 h-3 mr-1" />Cancel</> : <><Pencil className="w-3 h-3 mr-1" />Edit</>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 px-2 text-xs ${copied ? 'text-green-500' : 'text-slate-400 hover:text-slate-600'}`}
          onClick={handleCopy}
        >
          {copied ? <><Check className="w-3 h-3 mr-1" />Copied!</> : <><Copy className="w-3 h-3 mr-1" />Copy</>}
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/listings/platform-mocks/mock-post-shell.tsx
git commit -m "feat: add MockPostShell shared wrapper for platform mock edit/copy state"
```

---

### Task 2: Create FacebookPost component

**Files:**
- Create: `components/listings/platform-mocks/facebook-post.tsx`

**Step 1: Create the file**

```tsx
interface FacebookPostProps {
  content: string
  userName: string
  userInitials: string
}

export function FacebookPost({ content, userName, userInitials }: FacebookPostProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden font-sans max-w-[500px]">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {userInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] text-gray-900 leading-tight">{userName}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            Just now · <span>🌐</span>
          </p>
        </div>
        <button className="text-gray-400 hover:text-gray-600 text-xl leading-none">···</button>
      </div>

      {/* Post text */}
      <p className="px-4 pb-3 text-[15px] text-gray-800 leading-snug whitespace-pre-wrap">{content}</p>

      {/* Photo placeholder */}
      <div className="bg-gray-100 h-48 flex items-center justify-center border-t border-b border-gray-200">
        <div className="text-center text-gray-300">
          <div className="text-5xl mb-1">🏠</div>
          <p className="text-xs">Listing Photo</p>
        </div>
      </div>

      {/* Reactions */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>👍</span><span>❤️</span>
          <span className="ml-1">24 people reacted</span>
        </div>
        <span className="text-sm text-gray-500">3 comments</span>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-200" />

      {/* Action buttons */}
      <div className="flex items-center px-2 py-1">
        {[
          { icon: '👍', label: 'Like' },
          { icon: '💬', label: 'Comment' },
          { icon: '↗️', label: 'Share' },
        ].map(({ icon, label }) => (
          <button
            key={label}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span className="text-base">{icon}</span> {label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/listings/platform-mocks/facebook-post.tsx
git commit -m "feat: add FacebookPost platform mock component"
```

---

### Task 3: Create InstagramPost component

**Files:**
- Create: `components/listings/platform-mocks/instagram-post.tsx`

**Step 1: Create the file**

```tsx
interface InstagramPostProps {
  content: string
  userName: string
  userInitials: string
}

export function InstagramPost({ content, userName, userInitials }: InstagramPostProps) {
  const handle = userName.toLowerCase().replace(/\s+/g, '')

  // Split hashtags from caption body
  const lines = content.split('\n')
  const hashtagLine = lines.find(l => l.trim().startsWith('#')) ?? ''
  const captionBody = lines.filter(l => !l.trim().startsWith('#')).join('\n').trim()
  const hashtags = hashtagLine.split(' ').filter(t => t.startsWith('#'))

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden max-w-[400px] font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {userInitials}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900">{handle}</p>
        </div>
        <button className="text-gray-800 font-bold text-lg leading-none">···</button>
      </div>

      {/* Photo placeholder */}
      <div className="bg-gray-100 aspect-square flex items-center justify-center">
        <div className="text-center text-gray-300">
          <div className="text-6xl mb-2">🏠</div>
          <p className="text-xs">Listing Photo</p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 pb-1 flex items-center">
        <div className="flex items-center gap-4 flex-1">
          <button className="text-2xl hover:scale-110 transition-transform">🤍</button>
          <button className="text-2xl hover:scale-110 transition-transform">💬</button>
          <button className="text-2xl hover:scale-110 transition-transform">✈️</button>
        </div>
        <button className="text-2xl hover:scale-110 transition-transform">🔖</button>
      </div>

      {/* Likes */}
      <p className="px-4 text-sm font-semibold text-gray-900">47 likes</p>

      {/* Caption */}
      <div className="px-4 pt-1 pb-3 text-sm text-gray-900">
        <span className="font-semibold mr-1">{handle}</span>
        <span className="whitespace-pre-wrap">{captionBody}</span>
        {hashtags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {hashtags.map(tag => (
              <span key={tag} className="text-blue-500">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <p className="px-4 pb-3 text-[10px] uppercase tracking-widest text-gray-400">2 hours ago</p>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/listings/platform-mocks/instagram-post.tsx
git commit -m "feat: add InstagramPost platform mock component"
```

---

### Task 4: Create LinkedInPost component

**Files:**
- Create: `components/listings/platform-mocks/linkedin-post.tsx`

**Step 1: Create the file**

```tsx
interface LinkedInPostProps {
  content: string
  userName: string
  userInitials: string
}

export function LinkedInPost({ content, userName, userInitials }: LinkedInPostProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden max-w-[550px] font-sans">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0">
          {userInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-gray-900 leading-tight">{userName}</p>
            <span className="text-xs text-blue-600 border border-blue-300 rounded px-1 leading-tight">1st</span>
          </div>
          <p className="text-xs text-gray-500 leading-tight mt-0.5">Real Estate Professional</p>
          <p className="text-xs text-gray-400 leading-tight">Just now · 🌐</p>
        </div>
        <button className="text-sm font-semibold text-blue-600 border border-blue-600 rounded-full px-4 py-1 hover:bg-blue-50 transition-colors flex-shrink-0">
          + Follow
        </button>
      </div>

      {/* Post body */}
      <p className="px-4 pb-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{content}</p>

      {/* Engagement stats */}
      <div className="px-4 pb-2 flex items-center justify-between text-xs text-gray-500">
        <span>👍 ❤️ 18</span>
        <span>4 comments · 2 reposts</span>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-200" />

      {/* Action bar */}
      <div className="flex items-center px-2 py-1">
        {[
          { icon: '👍', label: 'Like' },
          { icon: '💬', label: 'Comment' },
          { icon: '🔁', label: 'Repost' },
          { icon: '📤', label: 'Send' },
        ].map(({ icon, label }) => (
          <button
            key={label}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/listings/platform-mocks/linkedin-post.tsx
git commit -m "feat: add LinkedInPost platform mock component"
```

---

### Task 5: Create NewsletterBlock component

**Files:**
- Create: `components/listings/platform-mocks/newsletter-block.tsx`

**Step 1: Create the file**

```tsx
interface NewsletterBlockProps {
  content: string
  userName: string
}

export function NewsletterBlock({ content, userName }: NewsletterBlockProps) {
  return (
    <div className="bg-gray-100 rounded-xl p-4 font-sans">
      {/* Email client chrome */}
      <div className="bg-white max-w-[560px] mx-auto rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Blue header */}
        <div className="bg-blue-600 px-6 py-5 text-white">
          <p className="text-xs uppercase tracking-widest opacity-75 mb-1">Market Update</p>
          <p className="text-xl font-bold">📬 New Listing Alert</p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-gray-100" />

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-400">
            Sent with ❤️ by {userName} &nbsp;·&nbsp;{' '}
            <span className="underline cursor-pointer">Unsubscribe</span> &nbsp;·&nbsp;{' '}
            <span className="underline cursor-pointer">View in browser</span>
          </p>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/listings/platform-mocks/newsletter-block.tsx
git commit -m "feat: add NewsletterBlock platform mock component"
```

---

### Task 6: Create GroupchatBubble component

**Files:**
- Create: `components/listings/platform-mocks/groupchat-bubble.tsx`

**Step 1: Create the file**

```tsx
interface GroupchatBubbleProps {
  content: string
  userName: string
  userInitials: string
}

export function GroupchatBubble({ content, userName, userInitials }: GroupchatBubbleProps) {
  return (
    <div className="rounded-xl overflow-hidden shadow-md max-w-[380px] font-sans" style={{ backgroundColor: '#1c1c1e' }}>
      {/* Group chat header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center justify-center mb-2">
          {/* Stacked avatars */}
          <div className="flex -space-x-2">
            {['JW', 'SR', 'MK'].map((initials, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                style={{
                  backgroundColor: ['#0a84ff', '#30d158', '#ff453a'][i],
                  borderColor: '#1c1c1e',
                }}
              >
                {initials}
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-white text-sm font-semibold">Realtor Network 🏠</p>
        <p className="text-center text-white/50 text-xs mt-0.5">3 members</p>
      </div>

      {/* Message */}
      <div className="px-4 py-4">
        <div className="flex items-end gap-2">
          {/* Sender avatar */}
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {userInitials}
          </div>

          {/* Bubble */}
          <div className="max-w-[260px]">
            <p className="text-white/60 text-xs mb-1 ml-1">{userName}</p>
            <div className="rounded-2xl rounded-bl-sm px-4 py-2.5" style={{ backgroundColor: '#3a3a3c' }}>
              <p className="text-white text-sm leading-relaxed">{content}</p>
            </div>
          </div>
        </div>

        {/* Timestamp + delivered */}
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-white/30 text-xs">Just now</p>
          <p className="text-white/30 text-xs">Delivered ✓</p>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/listings/platform-mocks/groupchat-bubble.tsx
git commit -m "feat: add GroupchatBubble platform mock component"
```

---

### Task 7: Update listing page to use platform mocks

**Files:**
- Modify: `app/(app)/listings/[id]/page.tsx`

Replace the `CARDS` array + `ContentCard` loop with the 5 dedicated platform components, each wrapped in `MockPostShell`. Pass `userName` and `userInitials` from the session.

**Step 1: Update the listing page**

Replace the entire file content with:

```tsx
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { RegenerateButton } from '@/components/listings/regenerate-button'
import { MockPostShell } from '@/components/listings/platform-mocks/mock-post-shell'
import { FacebookPost } from '@/components/listings/platform-mocks/facebook-post'
import { InstagramPost } from '@/components/listings/platform-mocks/instagram-post'
import { LinkedInPost } from '@/components/listings/platform-mocks/linkedin-post'
import { NewsletterBlock } from '@/components/listings/platform-mocks/newsletter-block'
import { GroupchatBubble } from '@/components/listings/platform-mocks/groupchat-bubble'

function getInitials(name: string | null | undefined): string {
  if (!name) return 'RE'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) notFound()

  let listing
  try {
    listing = await prisma.listing.findFirst({
      where: { id, userId },
      include: { generatedContent: true },
    })
  } catch (err) {
    console.error('[ListingPage] prisma query failed:', err)
    throw err
  }

  if (!listing) notFound()

  const content = listing.generatedContent
  const userName = session?.user?.name ?? 'Your Name'
  const userInitials = getInitials(session?.user?.name)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="text-slate-400 mt-1">
          <Link href="/listings">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{listing.address}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {listing.city && listing.state && (
              <span className="text-sm text-slate-500">
                {listing.city}, {listing.state}
              </span>
            )}
            {listing.listPrice && (
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                ${listing.listPrice.toLocaleString()}
              </Badge>
            )}
            {listing.beds && (
              <span className="text-sm text-slate-500">{listing.beds}bd</span>
            )}
            {listing.baths && (
              <span className="text-sm text-slate-500">{listing.baths}ba</span>
            )}
            {listing.sqft && (
              <span className="text-sm text-slate-500">{listing.sqft.toLocaleString()} sqft</span>
            )}
          </div>
        </div>
        <RegenerateButton listingId={id} />
      </div>

      {/* Platform mocks */}
      {content ? (
        <div className="space-y-8">
          <MockPostShell content={content.facebook} label="Facebook">
            {(text) => <FacebookPost content={text} userName={userName} userInitials={userInitials} />}
          </MockPostShell>

          <MockPostShell content={content.instagram} label="Instagram">
            {(text) => <InstagramPost content={text} userName={userName} userInitials={userInitials} />}
          </MockPostShell>

          <MockPostShell content={content.linkedin} label="LinkedIn">
            {(text) => <LinkedInPost content={text} userName={userName} userInitials={userInitials} />}
          </MockPostShell>

          <MockPostShell content={content.newsletter} label="Newsletter">
            {(text) => <NewsletterBlock content={text} userName={userName} />}
          </MockPostShell>

          <MockPostShell content={content.groupchat} label="Realtor Groupchat">
            {(text) => <GroupchatBubble content={text} userName={userName} userInitials={userInitials} />}
          </MockPostShell>

          <p className="text-xs text-slate-400 text-center pb-4">
            Generated by {content.provider}
          </p>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          No content generated yet.
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/\(app\)/listings/\[id\]/page.tsx
git commit -m "feat: replace generic content cards with platform mock UIs on listing results page"
```

---

### Task 8: Deploy

**Step 1: Push and deploy**

```bash
git push && vercel --prod
```

**Step 2: Verify**

- Generate a listing at `/listings/new`
- Confirm results page shows Facebook, Instagram, LinkedIn, Newsletter, Groupchat mocks
- Click Edit on one → textarea appears → change text → Cancel → mock restores
- Click Copy on one → button shows "Copied!" briefly
- Click Regenerate All → "Generating New Content..." spinner → page refreshes with new mocks
