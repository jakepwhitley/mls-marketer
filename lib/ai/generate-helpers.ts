// lib/ai/generate-helpers.ts
import type { ListingInput, GeneratedContentOutput } from './types'

export function buildPrompt(listing: ListingInput): string {
  const style = listing.stylePreference ?? 'professional'
  const styleGuide: Record<string, string> = {
    professional: 'Use a professional, market-savvy tone.',
    friendly: 'Use a warm, friendly, community-focused tone.',
    luxury: 'Use an elevated, aspirational luxury tone.',
    first_time_buyer: 'Use an approachable, encouraging tone for first-time buyers.',
  }

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

STYLE: ${styleGuide[style] ?? 'Use a professional tone.'}

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
  const keys = ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'NEWSLETTER', 'GROUPCHAT']
  const sections: Record<string, string> = {}

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
