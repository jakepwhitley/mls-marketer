import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Home, Zap, Clock, TrendingUp, Check } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">MLS Marketer</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-slate-600">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/auth/signup">Get started free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-6">
          AI-powered real estate marketing
        </Badge>
        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
          Turn MLS listings into
          <br />
          <span className="text-blue-600">ready-to-post content</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-8">
          Upload your MLS data and instantly get Facebook posts, Instagram captions,
          LinkedIn posts, newsletter copy, and groupchat blurbs — all in one click.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
            <Link href="/auth/signup">
              <Zap className="w-4 h-4 mr-2" />
              Start for free
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: 'One-click generation',
              desc: 'Upload your listing and generate 5 platform-specific posts simultaneously.',
            },
            {
              icon: Clock,
              title: 'Save hours weekly',
              desc: 'Stop writing from scratch. Get polished, professional copy in seconds.',
            },
            {
              icon: TrendingUp,
              title: 'Platform-optimized',
              desc: 'Each post is crafted for its platform — right tone, right length, right hashtags.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-blue-100">
              <CardContent className="pt-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">Simple pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {[
            {
              name: 'Free',
              price: '$0',
              desc: 'Perfect to get started',
              features: [
                '10 listings/month',
                'All 5 content types',
                'CSV & manual entry',
                'Copy & edit content',
              ],
              cta: 'Get started free',
              href: '/auth/signup',
              highlight: false,
              disabled: false,
            },
            {
              name: 'Pro',
              price: '$29/mo',
              desc: 'For active agents',
              features: [
                'Unlimited listings',
                'Everything in Free',
                'Priority generation',
                'Coming soon',
              ],
              cta: 'Coming soon',
              href: '#',
              highlight: true,
              disabled: true,
            },
          ].map(({ name, price, desc, features, cta, href, highlight, disabled }) => (
            <Card
              key={name}
              className={highlight ? 'border-blue-600 shadow-md' : 'border-blue-100'}
            >
              <CardContent className="pt-6">
                {highlight && (
                  <Badge className="bg-blue-600 text-white mb-4">Most Popular</Badge>
                )}
                <h3 className="text-xl font-bold text-slate-900">{name}</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2 mb-1">{price}</p>
                <p className="text-sm text-slate-500 mb-6">{desc}</p>
                <ul className="space-y-2 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {disabled ? (
                  <Button
                    className="w-full"
                    variant={highlight ? 'default' : 'outline'}
                    disabled
                  >
                    {cta}
                  </Button>
                ) : (
                  <Button
                    asChild
                    className={
                      highlight
                        ? 'w-full bg-blue-600 hover:bg-blue-700'
                        : 'w-full border-blue-200 text-blue-600 hover:bg-blue-50'
                    }
                    variant={highlight ? 'default' : 'outline'}
                  >
                    <Link href={href}>{cta}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-400">
        <p>© {new Date().getFullYear()} MLS Marketer. Built for real estate professionals.</p>
      </footer>
    </div>
  )
}
