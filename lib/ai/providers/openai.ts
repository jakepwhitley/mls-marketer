// lib/ai/providers/openai.ts
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
