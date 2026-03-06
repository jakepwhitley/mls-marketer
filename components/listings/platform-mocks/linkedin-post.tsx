interface LinkedInPostProps {
  content: string
  userName: string
  userInitials: string
}

export function LinkedInPost({ content, userName, userInitials }: LinkedInPostProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden max-w-[550px] font-sans">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0">
          {userInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-gray-900 leading-tight">{userName}</p>
            <span className="text-xs text-blue-600 border border-blue-300 rounded px-1 leading-tight">1st</span>
          </div>
          <p className="text-xs text-gray-500 leading-tight mt-0.5">Real Estate Professional</p>
          <p className="text-xs text-gray-400 leading-tight">Just now · 🌐</p>
        </div>
        <button className="text-sm font-semibold text-blue-600 border border-blue-600 rounded-full px-4 py-1 hover:bg-blue-50 transition-colors flex-shrink-0">
          + Follow
        </button>
      </div>

      {/* Post body */}
      <p className="px-4 pb-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{content}</p>

      {/* Engagement stats */}
      <div className="px-4 pb-2 flex items-center justify-between text-xs text-gray-500">
        <span>👍 ❤️ 18</span>
        <span>4 comments · 2 reposts</span>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-200" />

      {/* Action bar */}
      <div className="flex items-center px-2 py-1">
        {[
          { icon: '👍', label: 'Like' },
          { icon: '💬', label: 'Comment' },
          { icon: '🔁', label: 'Repost' },
          { icon: '📤', label: 'Send' },
        ].map(({ icon, label }) => (
          <button
            key={label}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>
    </div>
  )
}
