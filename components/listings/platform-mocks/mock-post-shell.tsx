'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Copy, Check, Pencil, X } from 'lucide-react'

interface MockPostShellProps {
  content: string
  label: string
  children: (text: string) => React.ReactNode
}

export function MockPostShell({ content, label, children }: MockPostShellProps) {
  const [editing, setEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(editedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 pl-1">{label}</p>

      {editing ? (
        <Textarea
          value={editedContent}
          onChange={e => setEditedContent(e.target.value)}
          className="min-h-[160px] text-sm border-blue-200 focus-visible:ring-blue-500"
        />
      ) : (
        children(editedContent)
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-slate-600 h-7 px-2 text-xs"
          onClick={() => setEditing(!editing)}
        >
          {editing ? <><X className="w-3 h-3 mr-1" />Cancel</> : <><Pencil className="w-3 h-3 mr-1" />Edit</>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 px-2 text-xs ${copied ? 'text-green-500' : 'text-slate-400 hover:text-slate-600'}`}
          onClick={handleCopy}
        >
          {copied ? <><Check className="w-3 h-3 mr-1" />Copied!</> : <><Copy className="w-3 h-3 mr-1" />Copy</>}
        </Button>
      </div>
    </div>
  )
}
