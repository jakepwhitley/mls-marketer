'use client'

import { useState, useTransition } from 'react'
import { parseMLSCsv } from '@/lib/csv/parser'
import { createListingAndGenerate } from '@/lib/actions/listings'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, AlertCircle, Zap } from 'lucide-react'

export function CsvUploadTab() {
  const [isPending, startTransition] = useTransition()
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ReturnType<typeof parseMLSCsv> | null>(null)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError('')
    const text = await f.text()
    const result = parseMLSCsv(text)
    setParsed(result)
  }

  function handleGenerate() {
    if (!parsed || parsed.listings.length === 0) return
    const listing = parsed.listings[0]
    if (!listing.address) {
      setError('Could not find an address column. Please check your CSV.')
      return
    }
    startTransition(async () => {
      const result = await createListingAndGenerate(listing)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="block mb-2">Upload MLS CSV Export</Label>
        <label
          htmlFor="csv-file"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <Upload className="w-8 h-8 text-blue-400 mb-2" />
          <span className="text-sm text-slate-500">{file ? file.name : 'Click to upload or drag and drop'}</span>
          <span className="text-xs text-slate-400 mt-1">CSV files only</span>
          <input id="csv-file" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      {parsed && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-slate-700">
              Found {parsed.listings.length} listing{parsed.listings.length !== 1 ? 's' : ''} in CSV
            </span>
          </div>

          {parsed.unmappedColumns.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">Unrecognized columns (will be ignored):</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {parsed.unmappedColumns.map(col => (
                  <Badge key={col} variant="outline" className="text-amber-600 border-amber-200 text-xs">{col}</Badge>
                ))}
              </div>
            </div>
          )}

          {parsed.listings[0] && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
              <p className="font-medium text-slate-700 mb-1">First listing preview:</p>
              <p className="text-slate-600">{parsed.listings[0].address || 'No address found'}</p>
              {parsed.listings[0].listPrice && (
                <p className="text-slate-500">${parsed.listings[0].listPrice.toLocaleString()}</p>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        onClick={handleGenerate}
        className="w-full bg-blue-600 hover:bg-blue-700 h-11"
        disabled={!parsed || isPending}
      >
        <Zap className="w-4 h-4 mr-2" />
        {isPending ? 'Generating content...' : 'Generate Marketing Content'}
      </Button>
    </div>
  )
}
