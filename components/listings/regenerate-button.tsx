'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { regenerateContent } from '@/lib/actions/listings'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export function RegenerateButton({ listingId }: { listingId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      await regenerateContent(listingId)
      router.refresh()
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-blue-200 text-blue-600 hover:bg-blue-50"
      onClick={handleClick}
      disabled={isPending}
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Generating New Content...' : 'Regenerate All'}
    </Button>
  )
}
