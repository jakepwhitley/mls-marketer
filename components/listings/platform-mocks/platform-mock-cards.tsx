'use client'

import { MockPostShell } from './mock-post-shell'
import { FacebookPost } from './facebook-post'
import { InstagramPost } from './instagram-post'
import { LinkedInPost } from './linkedin-post'
import { NewsletterBlock } from './newsletter-block'
import { GroupchatBubble } from './groupchat-bubble'

interface CardProps {
  content: string
  userName: string
  userInitials: string
}

interface NewsletterCardProps {
  content: string
  userName: string
}

export function FacebookMockCard({ content, userName, userInitials }: CardProps) {
  return (
    <MockPostShell content={content} label="Facebook">
      {(text) => <FacebookPost content={text} userName={userName} userInitials={userInitials} />}
    </MockPostShell>
  )
}

export function InstagramMockCard({ content, userName, userInitials }: CardProps) {
  return (
    <MockPostShell content={content} label="Instagram">
      {(text) => <InstagramPost content={text} userName={userName} userInitials={userInitials} />}
    </MockPostShell>
  )
}

export function LinkedInMockCard({ content, userName, userInitials }: CardProps) {
  return (
    <MockPostShell content={content} label="LinkedIn">
      {(text) => <LinkedInPost content={text} userName={userName} userInitials={userInitials} />}
    </MockPostShell>
  )
}

export function NewsletterMockCard({ content, userName }: NewsletterCardProps) {
  return (
    <MockPostShell content={content} label="Newsletter">
      {(text) => <NewsletterBlock content={text} userName={userName} />}
    </MockPostShell>
  )
}

export function GroupchatMockCard({ content, userName, userInitials }: CardProps) {
  return (
    <MockPostShell content={content} label="Realtor Groupchat">
      {(text) => <GroupchatBubble content={text} userName={userName} userInitials={userInitials} />}
    </MockPostShell>
  )
}
