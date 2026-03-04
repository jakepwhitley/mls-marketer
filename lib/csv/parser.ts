// lib/csv/parser.ts
import Papa from 'papaparse'
import type { ListingInput } from '@/lib/ai/types'

const COLUMN_ALIASES: Record<keyof Omit<ListingInput, 'stylePreference'>, string[]> = {
  address: ['address', 'street address', 'full address', 'property address', 'street'],
  city: ['city'],
  state: ['state', 'st'],
  zip: ['zip', 'postal code', 'zip code', 'zipcode'],
  listPrice: ['list price', 'price', 'listing price', 'asking price', 'sold price', 'close price'],
  beds: ['beds', 'bedrooms', 'br', '# beds', 'bed', 'total bedrooms'],
  baths: ['baths', 'bathrooms', 'full baths', '# baths', 'bath', 'total baths', 'total bathrooms'],
  sqft: ['sqft', 'square feet', 'sq ft', 'living area', 'square footage', 'total sqft', 'approx sqft'],
  yearBuilt: ['year built', 'yr built', 'yrbuilt', 'built', 'year built/renovated'],
  propertyType: ['type', 'property type', 'style', 'prop type', 'property subtype'],
  description: ['remarks', 'public remarks', 'description', 'comments', 'agent remarks', 'private remarks'],
}

export type ColumnMapping = Record<keyof Omit<ListingInput, 'stylePreference'>, string | null>

export function mapColumns(headers: string[]): ColumnMapping {
  const mapping = {} as ColumnMapping
  const normalizedHeaders = headers.map(h => ({
    original: h,
    normalized: h.toLowerCase().trim(),
  }))

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
    address: mapping.address ? (row[mapping.address] ?? '') : '',
    city: mapping.city ? row[mapping.city] || undefined : undefined,
    state: mapping.state ? row[mapping.state] || undefined : undefined,
    zip: mapping.zip ? row[mapping.zip] || undefined : undefined,
    listPrice: mapping.listPrice
      ? parseFloat(row[mapping.listPrice]?.replace(/[$,]/g, '')) || undefined
      : undefined,
    beds: mapping.beds ? parseInt(row[mapping.beds]) || undefined : undefined,
    baths: mapping.baths ? parseFloat(row[mapping.baths]) || undefined : undefined,
    sqft: mapping.sqft
      ? parseInt(row[mapping.sqft]?.replace(/,/g, '')) || undefined
      : undefined,
    yearBuilt: mapping.yearBuilt ? parseInt(row[mapping.yearBuilt]) || undefined : undefined,
    propertyType: mapping.propertyType ? row[mapping.propertyType] || undefined : undefined,
    description: mapping.description ? row[mapping.description] || undefined : undefined,
  }))

  return { listings, unmappedColumns, mapping }
}
