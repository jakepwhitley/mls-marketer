'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Copy, Check, RefreshCw, Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContentCardProps {
  platform: string
  content: string
  accentColor: string
  icon: React.ReactNode
  onRegenerate?: () => void
  isRegenerating?: boolean
}

export function ContentCard({
  platform,
  content,
  accentColor,
  icon,
  onRegenerate,
  isRegenerating,
}: ContentCardProps) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)

  async function handleCopy() {
    await navigator.clipboard.writeText(editedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className={cn('border-l-4 shadow-sm rounded-xl', accentColor)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            {icon}
            {platform}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-slate-400 hover:text-slate-600"
              onClick={() => setEditing(!editing)}
            >
              {editing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            </Button>
            {onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-slate-400 hover:text-slate-600"
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                <RefreshCw className={cn('w-4 h-4', isRegenerating && 'animate-spin')} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'w-8 h-8',
                copied ? 'text-green-500' : 'text-slate-400 hover:text-slate-600'
              )}
              onClick={handleCopy}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <Textarea
            value={editedContent}
            onChange={e => setEditedContent(e.target.value)}
            className="min-h-[120px] text-sm border-blue-200 focus-visible:ring-blue-500"
          />
        ) : (
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {editedContent}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
