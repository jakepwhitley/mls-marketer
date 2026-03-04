import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ManualEntryTab } from '@/components/listings/manual-entry-tab'
import { CsvUploadTab } from '@/components/listings/csv-upload-tab'
import { Upload, PenLine } from 'lucide-react'

export default function NewListingPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Listing</h1>
        <p className="text-slate-500 mt-1">Upload a CSV or enter listing details to generate marketing content</p>
      </div>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg">Listing Details</CardTitle>
          <CardDescription>Choose how you want to add your listing data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <PenLine className="w-4 h-4" /> Enter Manually
              </TabsTrigger>
              <TabsTrigger value="csv" className="flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload CSV
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              <ManualEntryTab />
            </TabsContent>
            <TabsContent value="csv">
              <CsvUploadTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
