// lib/ai/types.ts
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
