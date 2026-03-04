// lib/actions/listings.ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { generateListingContent } from '@/lib/ai/generate'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ListingInput } from '@/lib/ai/types'

const FREE_TIER_LIMIT = 10

async function checkUsageLimit(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const now = new Date()
  const resetAt = new Date(user.monthResetAt)
  if (
    now.getMonth() !== resetAt.getMonth() ||
    now.getFullYear() !== resetAt.getFullYear()
  ) {
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
      rawData: input as unknown as Prisma.JsonObject,
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
  const input = listing.rawData as unknown as ListingInput

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
