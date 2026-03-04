// lib/ai/generate.ts
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
