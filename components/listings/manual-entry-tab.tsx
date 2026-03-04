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
        city: (form.get('city') as string) || undefined,
        state: (form.get('state') as string) || undefined,
        zip: (form.get('zip') as string) || undefined,
        listPrice: form.get('listPrice') ? parseFloat(form.get('listPrice') as string) : undefined,
        beds: form.get('beds') ? parseInt(form.get('beds') as string) : undefined,
        baths: form.get('baths') ? parseFloat(form.get('baths') as string) : undefined,
        sqft: form.get('sqft') ? parseInt(form.get('sqft') as string) : undefined,
        yearBuilt: form.get('yearBuilt') ? parseInt(form.get('yearBuilt') as string) : undefined,
        propertyType: (form.get('propertyType') as string) || undefined,
        description: (form.get('description') as string) || undefined,
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
