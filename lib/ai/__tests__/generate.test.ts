// lib/ai/__tests__/generate.test.ts
import { describe, it, expect } from 'vitest'
import { buildPrompt, parseGeneratedContent } from '../generate-helpers'

describe('buildPrompt', () => {
  it('includes address in prompt', () => {
    const prompt = buildPrompt({ address: '123 Main St', listPrice: 500000 })
    expect(prompt).toContain('123 Main St')
    expect(prompt).toContain('$500,000')
  })

  it('uses luxury style guide when specified', () => {
    const prompt = buildPrompt({ address: '123 Main St', stylePreference: 'luxury' })
    expect(prompt).toContain('luxury')
  })

  it('defaults to professional style', () => {
    const prompt = buildPrompt({ address: '123 Main St' })
    expect(prompt).toContain('professional')
  })

  it('includes beds and baths', () => {
    const prompt = buildPrompt({ address: '123 Main St', beds: 3, baths: 2 })
    expect(prompt).toContain('3 bed')
    expect(prompt).toContain('2 bath')
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
    expect(result.newsletter).toBe('')
  })

  it('handles content with extra whitespace', () => {
    const text = `[FACEBOOK]\n\n  Some post  \n\n[INSTAGRAM]\nCaption`
    const result = parseGeneratedContent(text)
    expect(result.facebook).toBe('Some post')
  })
})
