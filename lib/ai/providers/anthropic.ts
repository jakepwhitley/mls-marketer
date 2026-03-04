// lib/ai/providers/anthropic.ts
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
