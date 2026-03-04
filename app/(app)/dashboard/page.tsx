import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getUserUsage } from '@/lib/actions/listings'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PlusCircle, FileText, TrendingUp, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [recentListings, usage, totalListings] = await Promise.all([
    prisma.listing.findMany({
      where: { userId },
      include: { generatedContent: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    getUserUsage(),
    prisma.listing.count({ where: { userId } }),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {session?.user?.name?.split(' ')[0]}</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/listings/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Listing
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Total Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{totalListings}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{usage?.used ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Free</Badge>
            <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50" disabled>
              Upgrade
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Usage meter */}
      {usage?.limit && (
        <Card className="border-blue-100">
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Monthly usage</span>
              <span className="text-slate-900 font-medium">{usage.used} / {usage.limit} listings</span>
            </div>
            <Progress value={(usage.used / usage.limit) * 100} className="h-2" />
            {usage.used >= usage.limit && (
              <p className="text-sm text-amber-600 mt-2">Monthly limit reached. Upgrade for unlimited listings.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Listings</h2>
          <Link href="/listings" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>

        {recentListings.length === 0 ? (
          <Card className="border-blue-100 border-dashed">
            <CardContent className="py-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No listings yet.</p>
              <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
                <Link href="/listings/new">Create your first listing</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentListings.map(listing => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{listing.address}</p>
                      <p className="text-sm text-slate-500">
                        {[
                          listing.city && listing.state ? `${listing.city}, ${listing.state}` : '',
                          listing.listPrice ? `$${listing.listPrice.toLocaleString()}` : '',
                        ].filter(Boolean).join(' · ')}
                        {' · '}
                        {formatDistanceToNow(listing.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    {listing.generatedContent && (
                      <Badge className="bg-green-50 text-green-700 border-green-200">Generated</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
