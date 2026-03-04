# MLS Marketer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a SaaS app where realtors upload MLS listing data and receive AI-generated marketing content for Facebook, Instagram, LinkedIn, newsletter, and realtor groupchat.

**Architecture:** Next.js 15 App Router with NextAuth v5 for auth, Prisma 7 + Supabase for data, and a swappable AI provider abstraction layer. CSV parsing handles fuzzy MLS column name matching. One-click generation produces all 5 content pieces simultaneously.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma 7 + `@prisma/adapter-pg`, Supabase (PostgreSQL), NextAuth v5 beta, Vitest (unit tests), Papaparse (CSV), Claude API (default AI provider)

---

## IMPORTANT: Prisma 7 Quirks

Prisma 7 is different from Prisma 5/6. Keep these in mind throughout:
- `url` is NOT in `schema.prisma` datasource block — DB config lives in `prisma.config.ts`
- Must use `@prisma/adapter-pg` and pass it to `new PrismaClient({ adapter })`
- Run `npx prisma migrate dev --name <name>` then `npx prisma generate` after schema changes
- Create a `src/lib/prisma.ts` singleton that creates the adapter and client

## IMPORTANT: Next.js 15 Quirks

- Route params are `Promise<{}>` — always `await params` in page/route handlers
- Middleware file should export `auth as middleware` from NextAuth
- Never initialize DB/external clients at module level in API routes — always inside the handler function

## IMPORTANT: Directory Name Has Spaces

The project lives at `/Users/jakewhitley/MLS Marketer/`. Always quote paths in shell commands.

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `/tmp/mls-marketer/` (scaffold here, then copy)
- Destination: `/Users/jakewhitley/MLS Marketer/`

**Step 1: Scaffold in /tmp to avoid path issues with spaces**

```bash
cd /tmp
npx create-next-app@latest mls-marketer \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

**Step 2: Copy scaffolded files to project directory**

```bash
cp -r /tmp/mls-marketer/. "/Users/jakewhitley/MLS Marketer/"
```

**Step 3: Fix .bin symlinks (they break on cp -r)**

```bash
cd "/Users/jakewhitley/MLS Marketer"
rm -f node_modules/.bin/next
ln -s ../next/dist/bin/next node_modules/.bin/next
rm -f node_modules/.bin/tsc
ln -s ../typescript/bin/tsc node_modules/.bin/tsc
```

**Step 4: Verify dev server starts**

```bash
cd "/Users/jakewhitley/MLS Marketer"
npm run dev
```
Expected: Server starts on http://localhost:3000

**Step 5: Commit**

```bash
cd "/Users/jakewhitley/MLS Marketer"
git add -A
git commit -m "feat: scaffold Next.js 15 project"
```

---

## Task 2: Install Dependencies

**Step 1: Install all dependencies**

```bash
cd "/Users/jakewhitley/MLS Marketer"
npm install \
  @prisma/client@latest \
  @prisma/adapter-pg \
  prisma \
  pg \
  next-auth@beta \
  @auth/prisma-adapter \
  papaparse \
  @types/papaparse \
  @anthropic-ai/sdk \
  openai \
  zod \
  vitest \
  @vitejs/plugin-react \
  @testing-library/react \
  @testing-library/jest-dom \
  jsdom
```

**Step 2: Install shadcn/ui**

```bash
cd "/Users/jakewhitley/MLS Marketer"
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Blue
- CSS variables: Yes

**Step 3: Add shadcn components we'll need**

```bash
npx shadcn@latest add button card input label textarea select tabs badge table dialog toast avatar dropdown-menu separator progress
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: install dependencies and shadcn/ui"
```

---

## Task 3: Environment Variables

**Files:**
- Create: `.env.local`
- Create: `.env.example`

**Step 1: Create `.env.local`**

```bash
# Get your Supabase connection string from the Supabase dashboard
# Project Settings → Database → Connection string (URI mode)
# Replace [YOUR-PASSWORD] with your actual DB password

cat > "/Users/jakewhitley/MLS Marketer/.env.local" << 'EOF'
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here-run-openssl-rand-base64-32"
AI_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
EOF
```

**Step 2: Create `.env.example`**

```
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""
AI_PROVIDER="anthropic"
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""
```

**Step 3: Make sure .gitignore has .env.local**

Check that `.gitignore` already contains `.env.local` (Next.js scaffold includes this). If not, add it.

**Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "feat: add environment variable templates"
```

---

## Task 4: Prisma 7 Setup + Database Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/prisma.config.ts`
- Create: `src/lib/prisma.ts`

**Step 1: Initialize Prisma**

```bash
cd "/Users/jakewhitley/MLS Marketer"
npx prisma init
```

**Step 2: Replace `prisma/schema.prisma` with**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                 String    @id @default(cuid())
  name               String?
  email              String    @unique
  emailVerified      DateTime?
  image              String?
  password           String?
  subscriptionStatus String    @default("free") // free | pro | agency
  stylePreference    String    @default("professional") // professional | friendly | luxury | first_time_buyer
  listingsThisMonth  Int       @default(0)
  monthResetAt       DateTime  @default(now())
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  accounts Account[]
  sessions Session[]
  listings Listing[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Listing {
  id           String   @id @default(cuid())
  userId       String
  address      String
  city         String?
  state        String?
  zip          String?
  listPrice    Float?
  beds         Int?
  baths        Float?
  sqft         Int?
  yearBuilt    Int?
  propertyType String?
  description  String?
  rawData      Json?
  createdAt    DateTime @default(now())

  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  generatedContent GeneratedContent?
}

model GeneratedContent {
  id         String   @id @default(cuid())
  listingId  String   @unique
  facebook   String   @db.Text
  instagram  String   @db.Text
  linkedin   String   @db.Text
  newsletter String   @db.Text
  groupchat  String   @db.Text
  provider   String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  listing Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)
}
```

**Step 3: Create `src/lib/prisma.ts`**

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 4: Run migration**

```bash
cd "/Users/jakewhitley/MLS Marketer"
npx prisma migrate dev --name init
npx prisma generate
```

Expected: Migration created and applied successfully.

**Step 5: Commit**

```bash
git add prisma/ src/lib/prisma.ts
git commit -m "feat: add Prisma schema and database migration"
```

---

## Task 5: NextAuth v5 Setup

**Files:**
- Create: `src/auth.ts`
- Create: `src/middleware.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

**Step 1: Create `src/auth.ts`**

```typescript
// src/auth.ts
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user || !user.password) return null
        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null
        return user
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
})
```

**Step 2: Install bcryptjs**

```bash
npm install bcryptjs @types/bcryptjs
```

**Step 3: Create `src/middleware.ts`**

```typescript
// src/middleware.ts
export { auth as middleware } from '@/auth'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/listings/:path*',
    '/settings/:path*',
  ],
}
```

**Step 4: Create `src/app/api/auth/[...nextauth]/route.ts`**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth'
export const { GET, POST } = handlers
```

**Step 5: Commit**

```bash
git add src/auth.ts src/middleware.ts src/app/api/
git commit -m "feat: add NextAuth v5 with credentials provider"
```

---

## Task 6: AI Abstraction Layer (with tests)

**Files:**
- Create: `src/lib/ai/types.ts`
- Create: `src/lib/ai/providers/anthropic.ts`
- Create: `src/lib/ai/providers/openai.ts`
- Create: `src/lib/ai/generate.ts`
- Create: `src/lib/ai/__tests__/generate.test.ts`

**Step 1: Create `src/lib/ai/types.ts`**

```typescript
// src/lib/ai/types.ts
export interface ListingInput {
  address: string
  city?: string
  state?: string
  zip?: string
  listPrice?: number
  beds?: number
  baths?: number
  sqft?: number
  yearBuilt?: number
  propertyType?: string
  description?: string
  stylePreference?: string
}

export interface GeneratedContentOutput {
  facebook: string
  instagram: string
  linkedin: string
  newsletter: string
  groupchat: string
  provider: string
}

export interface AIProvider {
  generate(listing: ListingInput): Promise<GeneratedContentOutput>
}
```

**Step 2: Create `src/lib/ai/providers/anthropic.ts`**

```typescript
// src/lib/ai/providers/anthropic.ts
import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, ListingInput, GeneratedContentOutput } from '../types'
import { buildPrompt, parseGeneratedContent } from '../generate-helpers'

export class AnthropicProvider implements AIProvider {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async generate(listing: ListingInput): Promise<GeneratedContentOutput> {
    const prompt = buildPrompt(listing)
    const message = await this.client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return { ...parseGeneratedContent(text), provider: 'anthropic' }
  }
}
```

**Step 3: Create `src/lib/ai/providers/openai.ts`**

```typescript
// src/lib/ai/providers/openai.ts
import OpenAI from 'openai'
import type { AIProvider, ListingInput, GeneratedContentOutput } from '../types'
import { buildPrompt, parseGeneratedContent } from '../generate-helpers'

export class OpenAIProvider implements AIProvider {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async generate(listing: ListingInput): Promise<GeneratedContentOutput> {
    const prompt = buildPrompt(listing)
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = completion.choices[0]?.message?.content ?? ''
    return { ...parseGeneratedContent(text), provider: 'openai' }
  }
}
```

**Step 4: Create `src/lib/ai/generate-helpers.ts`**

```typescript
// src/lib/ai/generate-helpers.ts
import type { ListingInput, GeneratedContentOutput } from './types'

export function buildPrompt(listing: ListingInput): string {
  const style = listing.stylePreference ?? 'professional'
  const styleGuide = {
    professional: 'Use a professional, market-savvy tone.',
    friendly: 'Use a warm, friendly, community-focused tone.',
    luxury: 'Use an elevated, aspirational luxury tone.',
    first_time_buyer: 'Use an approachable, encouraging tone for first-time buyers.',
  }[style] ?? 'Use a professional tone.'

  const details = [
    listing.address,
    listing.city && listing.state ? `${listing.city}, ${listing.state}` : '',
    listing.listPrice ? `$${listing.listPrice.toLocaleString()}` : '',
    listing.beds ? `${listing.beds} bed` : '',
    listing.baths ? `${listing.baths} bath` : '',
    listing.sqft ? `${listing.sqft.toLocaleString()} sqft` : '',
    listing.yearBuilt ? `Built ${listing.yearBuilt}` : '',
    listing.propertyType ?? '',
    listing.description ?? '',
  ].filter(Boolean).join(' | ')

  return `You are a real estate marketing expert. Generate marketing content for this listing.

LISTING DETAILS:
${details}

STYLE: ${styleGuide}

Generate EXACTLY 5 sections in this format (include the exact headers):

[FACEBOOK]
Write a 150-250 word Facebook post with storytelling tone about this home. Make it engaging and conversational.

[INSTAGRAM]
Write an 80-120 word Instagram caption followed by exactly 10 relevant hashtags on a new line starting with #.

[LINKEDIN]
Write a 100-150 word professional LinkedIn post about this listing. Focus on market value and investment potential.

[NEWSLETTER]
Write a 60-80 word paragraph suitable for inclusion in a real estate newsletter. Concise and informative.

[GROUPCHAT]
Write 2-3 sentences with key facts only, suitable for a quick message in a realtor network group chat.

Output only the 5 sections with their headers. No preamble or closing remarks.`
}

export function parseGeneratedContent(text: string): Omit<GeneratedContentOutput, 'provider'> {
  const sections: Record<string, string> = {}
  const keys = ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'NEWSLETTER', 'GROUPCHAT']

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]
    const start = text.indexOf(`[${key}]`)
    if (start === -1) {
      sections[key.toLowerCase()] = ''
      continue
    }
    const contentStart = start + key.length + 2
    const end = nextKey ? text.indexOf(`[${nextKey}]`) : text.length
    sections[key.toLowerCase()] = text.slice(contentStart, end === -1 ? text.length : end).trim()
  }

  return {
    facebook: sections.facebook ?? '',
    instagram: sections.instagram ?? '',
    linkedin: sections.linkedin ?? '',
    newsletter: sections.newsletter ?? '',
    groupchat: sections.groupchat ?? '',
  }
}
```

**Step 5: Create `src/lib/ai/generate.ts`**

```typescript
// src/lib/ai/generate.ts
import type { ListingInput, GeneratedContentOutput } from './types'
import { AnthropicProvider } from './providers/anthropic'
import { OpenAIProvider } from './providers/openai'

export async function generateListingContent(
  listing: ListingInput
): Promise<GeneratedContentOutput> {
  const providerName = process.env.AI_PROVIDER ?? 'anthropic'
  const provider = providerName === 'openai' ? new OpenAIProvider() : new AnthropicProvider()
  return provider.generate(listing)
}
```

**Step 6: Create `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 7: Write failing tests `src/lib/ai/__tests__/generate.test.ts`**

```typescript
// src/lib/ai/__tests__/generate.test.ts
import { describe, it, expect } from 'vitest'
import { buildPrompt, parseGeneratedContent } from '../generate-helpers'

describe('buildPrompt', () => {
  it('includes address in prompt', () => {
    const prompt = buildPrompt({ address: '123 Main St', listPrice: 500000 })
    expect(prompt).toContain('123 Main St')
    expect(prompt).toContain('$500,000')
  })

  it('uses style guide based on preference', () => {
    const prompt = buildPrompt({ address: '123 Main St', stylePreference: 'luxury' })
    expect(prompt).toContain('luxury')
  })
})

describe('parseGeneratedContent', () => {
  it('parses all 5 sections correctly', () => {
    const text = `[FACEBOOK]
Great Facebook post here.

[INSTAGRAM]
Instagram caption here.

[LINKEDIN]
LinkedIn post here.

[NEWSLETTER]
Newsletter paragraph here.

[GROUPCHAT]
Quick groupchat message.`

    const result = parseGeneratedContent(text)
    expect(result.facebook).toBe('Great Facebook post here.')
    expect(result.instagram).toBe('Instagram caption here.')
    expect(result.linkedin).toBe('LinkedIn post here.')
    expect(result.newsletter).toBe('Newsletter paragraph here.')
    expect(result.groupchat).toBe('Quick groupchat message.')
  })

  it('returns empty strings for missing sections', () => {
    const result = parseGeneratedContent('')
    expect(result.facebook).toBe('')
    expect(result.instagram).toBe('')
  })
})
```

**Step 8: Run tests to verify they pass**

```bash
cd "/Users/jakewhitley/MLS Marketer"
npx vitest run src/lib/ai/__tests__/generate.test.ts
```
Expected: All tests PASS

**Step 9: Commit**

```bash
git add src/lib/ai/ vitest.config.ts
git commit -m "feat: add swappable AI provider abstraction with tests"
```

---

## Task 7: CSV Parser (with tests)

**Files:**
- Create: `src/lib/csv/parser.ts`
- Create: `src/lib/csv/__tests__/parser.test.ts`

**Step 1: Write failing tests `src/lib/csv/__tests__/parser.test.ts`**

```typescript
// src/lib/csv/__tests__/parser.test.ts
import { describe, it, expect } from 'vitest'
import { parseMLSCsv, mapColumns } from '../parser'

describe('mapColumns', () => {
  it('maps standard column names to fields', () => {
    const headers = ['Address', 'List Price', 'Beds', 'Baths', 'Sqft']
    const mapping = mapColumns(headers)
    expect(mapping.address).toBe('Address')
    expect(mapping.listPrice).toBe('List Price')
    expect(mapping.beds).toBe('Beds')
    expect(mapping.baths).toBe('Baths')
    expect(mapping.sqft).toBe('Sqft')
  })

  it('maps alternate column names', () => {
    const headers = ['Street Address', 'Price', 'Bedrooms', 'Bathrooms', 'Square Feet']
    const mapping = mapColumns(headers)
    expect(mapping.address).toBe('Street Address')
    expect(mapping.listPrice).toBe('Price')
    expect(mapping.beds).toBe('Bedrooms')
  })

  it('returns null for unmapped columns', () => {
    const mapping = mapColumns(['Some Unknown Column'])
    expect(mapping.address).toBeNull()
  })
})

describe('parseMLSCsv', () => {
  it('parses a CSV string into listings', () => {
    const csv = `Address,List Price,Beds,Baths\n123 Main St,500000,3,2`
    const { listings, unmappedColumns } = parseMLSCsv(csv)
    expect(listings).toHaveLength(1)
    expect(listings[0].address).toBe('123 Main St')
    expect(listings[0].listPrice).toBe(500000)
    expect(listings[0].beds).toBe(3)
  })

  it('identifies unmapped columns', () => {
    const csv = `Address,CustomField\n123 Main St,some value`
    const { unmappedColumns } = parseMLSCsv(csv)
    expect(unmappedColumns).toContain('CustomField')
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/csv/__tests__/parser.test.ts
```
Expected: FAIL — module not found

**Step 3: Create `src/lib/csv/parser.ts`**

```typescript
// src/lib/csv/parser.ts
import Papa from 'papaparse'
import type { ListingInput } from '@/lib/ai/types'

const COLUMN_ALIASES: Record<keyof Omit<ListingInput, 'stylePreference'>, string[]> = {
  address: ['address', 'street address', 'full address', 'property address'],
  city: ['city'],
  state: ['state'],
  zip: ['zip', 'postal code', 'zip code'],
  listPrice: ['list price', 'price', 'listing price', 'asking price'],
  beds: ['beds', 'bedrooms', 'br', '# beds', 'bed'],
  baths: ['baths', 'bathrooms', 'full baths', '# baths', 'bath'],
  sqft: ['sqft', 'square feet', 'sq ft', 'living area', 'square footage', 'total sqft'],
  yearBuilt: ['year built', 'yr built', 'yrbuilt', 'built'],
  propertyType: ['type', 'property type', 'style', 'prop type'],
  description: ['remarks', 'public remarks', 'description', 'comments', 'private remarks'],
}

export type ColumnMapping = Record<keyof Omit<ListingInput, 'stylePreference'>, string | null>

export function mapColumns(headers: string[]): ColumnMapping {
  const mapping = {} as ColumnMapping
  const normalizedHeaders = headers.map(h => ({ original: h, normalized: h.toLowerCase().trim() }))

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const match = normalizedHeaders.find(h => aliases.includes(h.normalized))
    mapping[field as keyof ColumnMapping] = match ? match.original : null
  }

  return mapping
}

export function parseMLSCsv(csvText: string): {
  listings: ListingInput[]
  unmappedColumns: string[]
  mapping: ColumnMapping
} {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  const headers = result.meta.fields ?? []
  const mapping = mapColumns(headers)
  const mappedColumns = new Set(Object.values(mapping).filter(Boolean))
  const unmappedColumns = headers.filter(h => !mappedColumns.has(h))

  const listings: ListingInput[] = result.data.map(row => ({
    address: mapping.address ? row[mapping.address] ?? '' : '',
    city: mapping.city ? row[mapping.city] : undefined,
    state: mapping.state ? row[mapping.state] : undefined,
    zip: mapping.zip ? row[mapping.zip] : undefined,
    listPrice: mapping.listPrice ? parseFloat(row[mapping.listPrice]?.replace(/[$,]/g, '')) || undefined : undefined,
    beds: mapping.beds ? parseInt(row[mapping.beds]) || undefined : undefined,
    baths: mapping.baths ? parseFloat(row[mapping.baths]) || undefined : undefined,
    sqft: mapping.sqft ? parseInt(row[mapping.sqft]?.replace(/,/g, '')) || undefined : undefined,
    yearBuilt: mapping.yearBuilt ? parseInt(row[mapping.yearBuilt]) || undefined : undefined,
    propertyType: mapping.propertyType ? row[mapping.propertyType] : undefined,
    description: mapping.description ? row[mapping.description] : undefined,
  }))

  return { listings, unmappedColumns, mapping }
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/csv/__tests__/parser.test.ts
```
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/csv/
git commit -m "feat: add MLS CSV parser with fuzzy column mapping and tests"
```

---

## Task 8: Server Actions

**Files:**
- Create: `src/lib/actions/listings.ts`

**Step 1: Create `src/lib/actions/listings.ts`**

```typescript
// src/lib/actions/listings.ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateListingContent } from '@/lib/ai/generate'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ListingInput } from '@/lib/ai/types'

const FREE_TIER_LIMIT = 10

async function checkUsageLimit(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  // Reset monthly counter if new month
  const now = new Date()
  const resetAt = new Date(user.monthResetAt)
  if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
    await prisma.user.update({
      where: { id: userId },
      data: { listingsThisMonth: 0, monthResetAt: now },
    })
    return { canGenerate: true, used: 0, limit: FREE_TIER_LIMIT }
  }

  if (user.subscriptionStatus !== 'free') {
    return { canGenerate: true, used: user.listingsThisMonth, limit: null }
  }

  return {
    canGenerate: user.listingsThisMonth < FREE_TIER_LIMIT,
    used: user.listingsThisMonth,
    limit: FREE_TIER_LIMIT,
  }
}

export async function createListingAndGenerate(input: ListingInput) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const userId = session.user.id
  const { canGenerate } = await checkUsageLimit(userId)
  if (!canGenerate) {
    return { error: 'Monthly limit reached. Upgrade to Pro for unlimited listings.' }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })

  const listing = await prisma.listing.create({
    data: {
      userId,
      address: input.address,
      city: input.city,
      state: input.state,
      zip: input.zip,
      listPrice: input.listPrice,
      beds: input.beds,
      baths: input.baths,
      sqft: input.sqft,
      yearBuilt: input.yearBuilt,
      propertyType: input.propertyType,
      description: input.description,
      rawData: input as object,
    },
  })

  const generated = await generateListingContent({
    ...input,
    stylePreference: user?.stylePreference ?? 'professional',
  })

  await prisma.generatedContent.create({
    data: {
      listingId: listing.id,
      ...generated,
    },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { listingsThisMonth: { increment: 1 } },
  })

  revalidatePath('/dashboard')
  revalidatePath('/listings')
  redirect(`/listings/${listing.id}`)
}

export async function getUserUsage() {
  const session = await auth()
  if (!session?.user?.id) return null
  return checkUsageLimit(session.user.id)
}

export async function getListings() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  return prisma.listing.findMany({
    where: { userId: session.user.id },
    include: { generatedContent: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getListing(id: string) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  return prisma.listing.findFirst({
    where: { id, userId: session.user.id },
    include: { generatedContent: true },
  })
}

export async function regenerateContent(listingId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, userId: session.user.id },
  })
  if (!listing) return { error: 'Listing not found' }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const input = listing.rawData as ListingInput

  const generated = await generateListingContent({
    ...input,
    stylePreference: user?.stylePreference ?? 'professional',
  })

  await prisma.generatedContent.upsert({
    where: { listingId },
    update: generated,
    create: { listingId, ...generated },
  })

  revalidatePath(`/listings/${listingId}`)
}

export async function updateSettings(data: { name?: string; stylePreference?: string }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  })

  revalidatePath('/settings')
}

export async function signUpUser(email: string, password: string, name: string) {
  const bcrypt = await import('bcryptjs')
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Email already in use' }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({ data: { email, name, password: hashed } })
  return { success: true }
}
```

**Step 2: Commit**

```bash
git add src/lib/actions/
git commit -m "feat: add server actions for listings, generation, and auth"
```

---

## Task 9: App Layout + Sidebar

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/components/layout/sidebar.tsx`

**Step 1: Create sidebar component `src/components/layout/sidebar.tsx`**

```tsx
// src/components/layout/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, List, PlusCircle, Settings, LogOut, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/listings/new', icon: PlusCircle, label: 'New Listing' },
  { href: '/listings', icon: List, label: 'My Listings' },
]

interface SidebarProps {
  userName?: string | null
  userEmail?: string | null
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-64 bg-white border-r border-blue-100 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-blue-100">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Home className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-lg">MLS Marketer</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <Separator className="bg-blue-100" />

      {/* User + Settings */}
      <div className="px-3 py-4 space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-blue-50 text-blue-600'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>

        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
              {userName?.charAt(0)?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{userName ?? 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-slate-400 hover:text-slate-600"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
```

**Step 2: Install lucide-react if not present**

```bash
npm install lucide-react
```

**Step 3: Create `src/app/(app)/layout.tsx`**

```tsx
// src/app/(app)/layout.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/signin')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar userName={session.user?.name} userEmail={session.user?.email} />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add src/app/\(app\)/ src/components/layout/
git commit -m "feat: add app layout with sidebar navigation"
```

---

## Task 10: Auth Pages

**Files:**
- Create: `src/app/auth/signin/page.tsx`
- Create: `src/app/auth/signup/page.tsx`

**Step 1: Create `src/app/auth/signin/page.tsx`**

```tsx
// src/app/auth/signin/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Invalid email or password')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-blue-100">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-slate-900">Welcome back</CardTitle>
          <CardDescription>Sign in to your MLS Marketer account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required placeholder="••••••••" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Create `src/app/auth/signup/page.tsx`**

```tsx
// src/app/auth/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home } from 'lucide-react'
import { signUpUser } from '@/lib/actions/listings'

export default function SignUpPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const result = await signUpUser(
      form.get('email') as string,
      form.get('password') as string,
      form.get('name') as string,
    )
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/auth/signin?registered=1')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-blue-100">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-slate-900">Create account</CardTitle>
          <CardDescription>Start generating listings in minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required placeholder="Jane Smith" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={8} placeholder="Min 8 characters" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/auth/
git commit -m "feat: add sign in and sign up pages"
```

---

## Task 11: Dashboard Page

**Files:**
- Create: `src/app/(app)/dashboard/page.tsx`

**Step 1: Create `src/app/(app)/dashboard/page.tsx`**

```tsx
// src/app/(app)/dashboard/page.tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getUserUsage } from '@/lib/actions/listings'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PlusCircle, FileText, TrendingUp, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [recentListings, usage] = await Promise.all([
    prisma.listing.findMany({
      where: { userId },
      include: { generatedContent: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    getUserUsage(),
  ])

  const totalListings = await prisma.listing.count({ where: { userId } })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {session?.user?.name?.split(' ')[0]}</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/listings/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Listing
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Total Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{totalListings}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{usage?.used ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Free</Badge>
            <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50" disabled>
              Upgrade
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Usage meter */}
      {usage?.limit && (
        <Card className="border-blue-100">
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Monthly usage</span>
              <span className="text-slate-900 font-medium">{usage.used} / {usage.limit} listings</span>
            </div>
            <Progress value={(usage.used / usage.limit) * 100} className="h-2" />
            {usage.used >= usage.limit && (
              <p className="text-sm text-amber-600 mt-2">Monthly limit reached. Upgrade for unlimited listings.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Listings</h2>
          <Link href="/listings" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>

        {recentListings.length === 0 ? (
          <Card className="border-blue-100 border-dashed">
            <CardContent className="py-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No listings yet.</p>
              <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
                <Link href="/listings/new">Create your first listing</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentListings.map(listing => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{listing.address}</p>
                      <p className="text-sm text-slate-500">
                        {listing.city && listing.state ? `${listing.city}, ${listing.state} · ` : ''}
                        {listing.listPrice ? `$${listing.listPrice.toLocaleString()} · ` : ''}
                        {formatDistanceToNow(listing.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    {listing.generatedContent && (
                      <Badge className="bg-green-50 text-green-700 border-green-200">Generated</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Install date-fns**

```bash
npm install date-fns
```

**Step 3: Commit**

```bash
git add src/app/\(app\)/dashboard/
git commit -m "feat: add dashboard page with stats and recent listings"
```

---

## Task 12: New Listing Page (CSV + Manual)

**Files:**
- Create: `src/app/(app)/listings/new/page.tsx`
- Create: `src/components/listings/csv-upload-tab.tsx`
- Create: `src/components/listings/manual-entry-tab.tsx`

**Step 1: Create `src/components/listings/manual-entry-tab.tsx`**

```tsx
// src/components/listings/manual-entry-tab.tsx
'use client'

import { useState, useTransition } from 'react'
import { createListingAndGenerate } from '@/lib/actions/listings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Zap } from 'lucide-react'

export function ManualEntryTab() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createListingAndGenerate({
        address: form.get('address') as string,
        city: form.get('city') as string || undefined,
        state: form.get('state') as string || undefined,
        zip: form.get('zip') as string || undefined,
        listPrice: form.get('listPrice') ? parseFloat(form.get('listPrice') as string) : undefined,
        beds: form.get('beds') ? parseInt(form.get('beds') as string) : undefined,
        baths: form.get('baths') ? parseFloat(form.get('baths') as string) : undefined,
        sqft: form.get('sqft') ? parseInt(form.get('sqft') as string) : undefined,
        yearBuilt: form.get('yearBuilt') ? parseInt(form.get('yearBuilt') as string) : undefined,
        propertyType: form.get('propertyType') as string || undefined,
        description: form.get('description') as string || undefined,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input id="address" name="address" required placeholder="123 Maple Street" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" placeholder="Austin" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" placeholder="TX" maxLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">Zip</Label>
            <Input id="zip" name="zip" placeholder="78701" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="listPrice">List Price ($)</Label>
          <Input id="listPrice" name="listPrice" type="number" placeholder="450000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="propertyType">Property Type</Label>
          <Input id="propertyType" name="propertyType" placeholder="Single Family" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="beds">Bedrooms</Label>
          <Input id="beds" name="beds" type="number" placeholder="3" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="baths">Bathrooms</Label>
          <Input id="baths" name="baths" type="number" step="0.5" placeholder="2.5" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sqft">Square Feet</Label>
          <Input id="sqft" name="sqft" type="number" placeholder="1850" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="yearBuilt">Year Built</Label>
          <Input id="yearBuilt" name="yearBuilt" type="number" placeholder="2005" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="description">Public Remarks / Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Stunning home in the heart of downtown..."
            className="min-h-[100px]"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={isPending}>
        <Zap className="w-4 h-4 mr-2" />
        {isPending ? 'Generating content...' : 'Generate Marketing Content'}
      </Button>
    </form>
  )
}
```

**Step 2: Create `src/components/listings/csv-upload-tab.tsx`**

```tsx
// src/components/listings/csv-upload-tab.tsx
'use client'

import { useState, useTransition } from 'react'
import { parseMLSCsv } from '@/lib/csv/parser'
import { createListingAndGenerate } from '@/lib/actions/listings'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, AlertCircle, Zap } from 'lucide-react'

export function CsvUploadTab() {
  const [isPending, startTransition] = useTransition()
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ReturnType<typeof parseMLSCsv> | null>(null)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError('')
    const text = await f.text()
    const result = parseMLSCsv(text)
    setParsed(result)
  }

  function handleGenerate() {
    if (!parsed || parsed.listings.length === 0) return
    // Generate for first listing in CSV (single listing flow)
    const listing = parsed.listings[0]
    if (!listing.address) {
      setError('Could not find an address column. Please check your CSV.')
      return
    }

    startTransition(async () => {
      const result = await createListingAndGenerate(listing)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="csv-file" className="block mb-2">Upload MLS CSV Export</Label>
        <label
          htmlFor="csv-file"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <Upload className="w-8 h-8 text-blue-400 mb-2" />
          <span className="text-sm text-slate-500">{file ? file.name : 'Click to upload or drag and drop'}</span>
          <span className="text-xs text-slate-400 mt-1">CSV files only</span>
          <input id="csv-file" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      {parsed && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-slate-700">
              Found {parsed.listings.length} listing{parsed.listings.length !== 1 ? 's' : ''} in CSV
            </span>
          </div>

          {parsed.unmappedColumns.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">Unrecognized columns (will be ignored):</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {parsed.unmappedColumns.map(col => (
                  <Badge key={col} variant="outline" className="text-amber-600 border-amber-200 text-xs">{col}</Badge>
                ))}
              </div>
            </div>
          )}

          {parsed.listings[0] && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
              <p className="font-medium text-slate-700 mb-1">First listing preview:</p>
              <p className="text-slate-600">{parsed.listings[0].address || 'No address found'}</p>
              {parsed.listings[0].listPrice && <p className="text-slate-500">${parsed.listings[0].listPrice.toLocaleString()}</p>}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        onClick={handleGenerate}
        className="w-full bg-blue-600 hover:bg-blue-700 h-11"
        disabled={!parsed || isPending}
      >
        <Zap className="w-4 h-4 mr-2" />
        {isPending ? 'Generating content...' : 'Generate Marketing Content'}
      </Button>
    </div>
  )
}
```

**Step 3: Create `src/app/(app)/listings/new/page.tsx`**

```tsx
// src/app/(app)/listings/new/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ManualEntryTab } from '@/components/listings/manual-entry-tab'
import { CsvUploadTab } from '@/components/listings/csv-upload-tab'
import { Upload, PenLine } from 'lucide-react'

export default function NewListingPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Listing</h1>
        <p className="text-slate-500 mt-1">Upload a CSV or enter listing details to generate marketing content</p>
      </div>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg">Listing Details</CardTitle>
          <CardDescription>Choose how you want to add your listing data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <PenLine className="w-4 h-4" /> Enter Manually
              </TabsTrigger>
              <TabsTrigger value="csv" className="flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload CSV
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              <ManualEntryTab />
            </TabsContent>
            <TabsContent value="csv">
              <CsvUploadTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add src/app/\(app\)/listings/new/ src/components/listings/
git commit -m "feat: add new listing page with CSV upload and manual entry"
```

---

## Task 13: Results Page (5 Content Cards)

**Files:**
- Create: `src/app/(app)/listings/[id]/page.tsx`
- Create: `src/components/listings/content-card.tsx`

**Step 1: Create `src/components/listings/content-card.tsx`**

```tsx
// src/components/listings/content-card.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Copy, Check, RefreshCw, Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContentCardProps {
  platform: string
  content: string
  accentColor: string
  icon: React.ReactNode
  onRegenerate?: () => void
  isRegenerating?: boolean
}

export function ContentCard({ platform, content, accentColor, icon, onRegenerate, isRegenerating }: ContentCardProps) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)

  async function handleCopy() {
    await navigator.clipboard.writeText(editedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className={cn('border-l-4 border-t-0 border-r-0 border-b-0 shadow-sm', accentColor)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            {icon}
            {platform}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-slate-400 hover:text-slate-600"
              onClick={() => setEditing(!editing)}
            >
              {editing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            </Button>
            {onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-slate-400 hover:text-slate-600"
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                <RefreshCw className={cn('w-4 h-4', isRegenerating && 'animate-spin')} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn('w-8 h-8', copied ? 'text-green-500' : 'text-slate-400 hover:text-slate-600')}
              onClick={handleCopy}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <Textarea
            value={editedContent}
            onChange={e => setEditedContent(e.target.value)}
            className="min-h-[120px] text-sm border-blue-200 focus:ring-blue-500"
          />
        ) : (
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{editedContent}</p>
        )}
      </CardContent>
    </Card>
  )
}
```

**Step 2: Create `src/app/(app)/listings/[id]/page.tsx`**

```tsx
// src/app/(app)/listings/[id]/page.tsx
import { getListing, regenerateContent } from '@/lib/actions/listings'
import { notFound } from 'next/navigation'
import { ContentCard } from '@/components/listings/content-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

// Platform icon SVGs as simple components
function FBIcon() { return <span className="text-blue-600 font-bold text-xs">f</span> }
function IGIcon() { return <span className="text-pink-500 font-bold text-xs">IG</span> }
function LIIcon() { return <span className="text-sky-600 font-bold text-xs">in</span> }
function NLIcon() { return <span className="text-indigo-500 font-bold text-xs">✉</span> }
function GCIcon() { return <span className="text-slate-500 font-bold text-xs">💬</span> }

const CARDS = [
  { key: 'facebook', platform: 'Facebook', accentColor: 'border-l-blue-500', icon: <FBIcon /> },
  { key: 'instagram', platform: 'Instagram', accentColor: 'border-l-pink-500', icon: <IGIcon /> },
  { key: 'linkedin', platform: 'LinkedIn', accentColor: 'border-l-sky-500', icon: <LIIcon /> },
  { key: 'newsletter', platform: 'Newsletter', accentColor: 'border-l-indigo-500', icon: <NLIcon /> },
  { key: 'groupchat', platform: 'Realtor Groupchat', accentColor: 'border-l-slate-400', icon: <GCIcon /> },
] as const

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) notFound()

  const content = listing.generatedContent

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="text-slate-400">
          <Link href="/listings"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{listing.address}</h1>
          <div className="flex items-center gap-2 mt-1">
            {listing.city && <span className="text-sm text-slate-500">{listing.city}{listing.state ? `, ${listing.state}` : ''}</span>}
            {listing.listPrice && <Badge variant="outline" className="border-blue-200 text-blue-700">${listing.listPrice.toLocaleString()}</Badge>}
            {listing.beds && <span className="text-sm text-slate-500">{listing.beds}bd</span>}
            {listing.baths && <span className="text-sm text-slate-500">{listing.baths}ba</span>}
            {listing.sqft && <span className="text-sm text-slate-500">{listing.sqft.toLocaleString()} sqft</span>}
          </div>
        </div>
        <form action={async () => { 'use server'; await regenerateContent(id) }}>
          <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate All
          </Button>
        </form>
      </div>

      {content ? (
        <div className="space-y-4">
          {CARDS.map(({ key, platform, accentColor, icon }) => (
            <ContentCard
              key={key}
              platform={platform}
              content={content[key]}
              accentColor={accentColor}
              icon={icon}
            />
          ))}
          <p className="text-xs text-slate-400 text-center">Generated by {content.provider}</p>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">No content generated yet.</div>
      )}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/\(app\)/listings/\[id\]/ src/components/listings/content-card.tsx
git commit -m "feat: add listing results page with 5 content cards"
```

---

## Task 14: Listings Table Page

**Files:**
- Create: `src/app/(app)/listings/page.tsx`

**Step 1: Create `src/app/(app)/listings/page.tsx`**

```tsx
// src/app/(app)/listings/page.tsx
import { getListings } from '@/lib/actions/listings'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, FileText, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default async function ListingsPage() {
  const listings = await getListings()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
          <p className="text-slate-500 mt-1">{listings.length} listing{listings.length !== 1 ? 's' : ''} total</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/listings/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Listing
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card className="border-blue-100 border-dashed">
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No listings yet.</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/listings/new">Create your first listing</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border-blue-100">
          <div className="divide-y divide-slate-100">
            {listings.map(listing => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="block hover:bg-blue-50 transition-colors">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{listing.address}</p>
                    <p className="text-sm text-slate-500">
                      {[
                        listing.city && listing.state ? `${listing.city}, ${listing.state}` : '',
                        listing.listPrice ? `$${listing.listPrice.toLocaleString()}` : '',
                        listing.beds ? `${listing.beds}bd` : '',
                        listing.baths ? `${listing.baths}ba` : '',
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-xs text-slate-400">{formatDistanceToNow(listing.createdAt, { addSuffix: true })}</span>
                    {listing.generatedContent
                      ? <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Generated</Badge>
                      : <Badge variant="outline" className="text-slate-500 text-xs">Pending</Badge>
                    }
                    <ExternalLink className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/\(app\)/listings/page.tsx
git commit -m "feat: add listings table page"
```

---

## Task 15: Settings Page

**Files:**
- Create: `src/app/(app)/settings/page.tsx`

**Step 1: Create `src/app/(app)/settings/page.tsx`**

```tsx
// src/app/(app)/settings/page.tsx
'use client'

import { useState, useTransition } from 'react'
import { updateSettings } from '@/lib/actions/listings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Check } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [style, setStyle] = useState('professional')

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateSettings({
        name: form.get('name') as string,
        stylePreference: style,
      })
      await update()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and content preferences</p>
      </div>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" defaultValue={session?.user?.name ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={session?.user?.email ?? ''} disabled className="bg-slate-50" />
              <p className="text-xs text-slate-400">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label>Content style preference</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="first_time_buyer">First-Time Buyer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">This tone is applied to all generated content</p>
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isPending}>
              {saved ? <><Check className="w-4 h-4 mr-2" />Saved</> : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator className="bg-blue-100" />

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Free Plan</p>
              <p className="text-sm text-slate-500">10 listings per month</p>
            </div>
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Current</Badge>
          </div>
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 w-full" disabled>
            Upgrade to Pro — Coming Soon
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Add SessionProvider to root layout**

Wrap the root `src/app/layout.tsx` with a `SessionProvider` (required for `useSession` on the settings page):

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MLS Marketer',
  description: 'AI-powered real estate marketing content generator',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/\(app\)/settings/ src/app/layout.tsx
git commit -m "feat: add settings page and root session provider"
```

---

## Task 16: Landing Page

**Files:**
- Create: `src/app/page.tsx`

**Step 1: Create `src/app/page.tsx`**

```tsx
// src/app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Home, Zap, Clock, TrendingUp, Check } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900">MLS Marketer</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild className="text-slate-600">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/auth/signup">Get started free</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-6">AI-powered real estate marketing</Badge>
        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
          Turn MLS listings into<br />
          <span className="text-blue-600">ready-to-post content</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-8">
          Upload your MLS data and instantly get Facebook posts, Instagram captions, LinkedIn posts, newsletter copy, and groupchat blurbs — all in one click.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
            <Link href="/auth/signup">
              <Zap className="w-4 h-4 mr-2" />
              Start for free
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: 'One-click generation', desc: 'Upload your listing and generate 5 platform-specific posts simultaneously.' },
            { icon: Clock, title: 'Save hours weekly', desc: 'Stop writing from scratch. Get polished, professional copy in seconds.' },
            { icon: TrendingUp, title: 'Platform-optimized', desc: 'Each post is crafted for its platform — right tone, right length, right hashtags.' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-blue-100">
              <CardContent className="pt-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">Simple pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {[
            {
              name: 'Free',
              price: '$0',
              desc: 'Perfect to get started',
              features: ['10 listings/month', 'All 5 content types', 'CSV & manual entry', 'Copy & edit content'],
              cta: 'Get started free',
              href: '/auth/signup',
              highlight: false,
            },
            {
              name: 'Pro',
              price: '$29/mo',
              desc: 'For active agents',
              features: ['Unlimited listings', 'Everything in Free', 'Priority generation', 'Coming soon'],
              cta: 'Coming soon',
              href: '#',
              highlight: true,
              disabled: true,
            },
          ].map(({ name, price, desc, features, cta, href, highlight, disabled }) => (
            <Card key={name} className={highlight ? 'border-blue-600 shadow-md' : 'border-blue-100'}>
              <CardContent className="pt-6">
                {highlight && <Badge className="bg-blue-600 text-white mb-4">Most Popular</Badge>}
                <h3 className="text-xl font-bold text-slate-900">{name}</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2 mb-1">{price}</p>
                <p className="text-sm text-slate-500 mb-6">{desc}</p>
                <ul className="space-y-2 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild={!disabled}
                  className={highlight ? 'w-full bg-blue-600 hover:bg-blue-700' : 'w-full'}
                  variant={highlight ? 'default' : 'outline'}
                  disabled={disabled}
                >
                  {disabled ? <span>{cta}</span> : <Link href={href}>{cta}</Link>}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-400">
        <p>© {new Date().getFullYear()} MLS Marketer. Built for real estate professionals.</p>
      </footer>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add landing page with hero, features, and pricing"
```

---

## Task 17: Final Verification

**Step 1: Run all unit tests**

```bash
cd "/Users/jakewhitley/MLS Marketer"
npx vitest run
```
Expected: All tests pass

**Step 2: Type check**

```bash
node node_modules/typescript/bin/tsc --noEmit
```
Expected: No errors

**Step 3: Build check**

```bash
node node_modules/.bin/next build
```
Expected: Build succeeds

**Step 4: Test the app manually**

1. Start dev server: `npm run dev`
2. Visit http://localhost:3000 — landing page should load
3. Sign up at /auth/signup
4. Sign in and reach /dashboard
5. Create a listing via /listings/new (manual entry)
6. Verify results page at /listings/[id] shows 5 content cards
7. Copy a card — verify green checkmark feedback
8. Try CSV upload with a sample CSV

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete MLS Marketer v1 — full app with auth, AI generation, and 5 content cards"
```
