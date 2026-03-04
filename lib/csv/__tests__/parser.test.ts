// lib/csv/__tests__/parser.test.ts
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
    expect(mapping.baths).toBe('Bathrooms')
    expect(mapping.sqft).toBe('Square Feet')
  })

  it('returns null for unmapped columns', () => {
    const mapping = mapColumns(['Some Unknown Column'])
    expect(mapping.address).toBeNull()
    expect(mapping.listPrice).toBeNull()
  })

  it('is case-insensitive', () => {
    const mapping = mapColumns(['ADDRESS', 'LIST PRICE'])
    expect(mapping.address).toBe('ADDRESS')
    expect(mapping.listPrice).toBe('LIST PRICE')
  })
})

describe('parseMLSCsv', () => {
  it('parses a basic CSV into listings', () => {
    const csv = `Address,List Price,Beds,Baths\n123 Main St,500000,3,2`
    const { listings } = parseMLSCsv(csv)
    expect(listings).toHaveLength(1)
    expect(listings[0].address).toBe('123 Main St')
    expect(listings[0].listPrice).toBe(500000)
    expect(listings[0].beds).toBe(3)
    expect(listings[0].baths).toBe(2)
  })

  it('handles price with dollar sign and commas', () => {
    const csv = `Address,List Price\n456 Oak Ave,"$1,250,000"`
    const { listings } = parseMLSCsv(csv)
    expect(listings[0].listPrice).toBe(1250000)
  })

  it('identifies unmapped columns', () => {
    const csv = `Address,CustomField,AnotherUnknown\n123 Main St,some value,other`
    const { unmappedColumns } = parseMLSCsv(csv)
    expect(unmappedColumns).toContain('CustomField')
    expect(unmappedColumns).toContain('AnotherUnknown')
  })

  it('does not include standard columns in unmapped', () => {
    const csv = `Address,List Price\n123 Main St,500000`
    const { unmappedColumns } = parseMLSCsv(csv)
    expect(unmappedColumns).not.toContain('Address')
    expect(unmappedColumns).not.toContain('List Price')
  })

  it('parses multiple listings', () => {
    const csv = `Address,Beds\n123 Main St,3\n456 Oak Ave,4`
    const { listings } = parseMLSCsv(csv)
    expect(listings).toHaveLength(2)
    expect(listings[1].address).toBe('456 Oak Ave')
    expect(listings[1].beds).toBe(4)
  })
})
