'use client'

import { useState, useTransition } from 'react'
import { updateSettings } from '@/lib/actions/listings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Check } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [style, setStyle] = useState('professional')

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateSettings({
        name: form.get('name') as string,
        stylePreference: style,
      })
      await update()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and content preferences</p>
      </div>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={session?.user?.name ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={session?.user?.email ?? ''}
                disabled
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-400">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label>Content style preference</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="first_time_buyer">First-Time Buyer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                This tone is applied to all generated content
              </p>
            </div>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isPending}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator className="bg-blue-100" />

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Free Plan</p>
              <p className="text-sm text-slate-500">10 listings per month</p>
            </div>
            <Badge
              variant="outline"
              className="border-blue-200 text-blue-700 bg-blue-50"
            >
              Current
            </Badge>
          </div>
          <Button
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50 w-full"
            disabled
          >
            Upgrade to Pro — Coming Soon
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
