interface NewsletterBlockProps {
  content: string
  userName: string
}

export function NewsletterBlock({ content, userName }: NewsletterBlockProps) {
  return (
    <div className="bg-gray-100 rounded-xl p-4 font-sans max-w-[560px] mx-auto">
      {/* Email client chrome */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Blue header */}
        <div className="bg-blue-600 px-6 py-5 text-white">
          <p className="text-xs uppercase tracking-widest opacity-75 mb-1">Market Update</p>
          <p className="text-xl font-bold">📬 New Listing Alert</p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-gray-100" />

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-400">
            Sent with ❤️ by {userName} &nbsp;·&nbsp;{' '}
            <span className="underline cursor-pointer">Unsubscribe</span> &nbsp;·&nbsp;{' '}
            <span className="underline cursor-pointer">View in browser</span>
          </p>
        </div>
      </div>
    </div>
  )
}
