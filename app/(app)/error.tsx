'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
      <p className="text-sm text-slate-500 max-w-md">{error.message}</p>
      {error.digest && (
        <p className="text-xs text-slate-400">Digest: {error.digest}</p>
      )}
      <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700 mt-2">Try again</Button>
    </div>
  )
}
