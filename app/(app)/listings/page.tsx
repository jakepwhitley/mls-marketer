import { getListings } from '@/lib/actions/listings'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, FileText, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default async function ListingsPage() {
  const listings = await getListings()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
          <p className="text-slate-500 mt-1">
            {listings.length} listing{listings.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/listings/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Listing
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card className="border-blue-100 border-dashed">
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No listings yet.</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/listings/new">Create your first listing</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border-blue-100">
          <div className="divide-y divide-slate-100">
            {listings.map(listing => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{listing.address}</p>
                  <p className="text-sm text-slate-500">
                    {[
                      listing.city && listing.state
                        ? `${listing.city}, ${listing.state}`
                        : '',
                      listing.listPrice
                        ? `$${listing.listPrice.toLocaleString()}`
                        : '',
                      listing.beds ? `${listing.beds}bd` : '',
                      listing.baths ? `${listing.baths}ba` : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(listing.createdAt, { addSuffix: true })}
                  </span>
                  {listing.generatedContent ? (
                    <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                      Generated
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500 text-xs">
                      Pending
                    </Badge>
                  )}
                  <ExternalLink className="w-4 h-4 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
