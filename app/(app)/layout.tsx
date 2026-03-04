import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/signin')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar userName={session.user?.name} userEmail={session.user?.email} />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
