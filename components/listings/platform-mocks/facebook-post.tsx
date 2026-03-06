interface FacebookPostProps {
  content: string
  userName: string
  userInitials: string
}

export function FacebookPost({ content, userName, userInitials }: FacebookPostProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden font-sans max-w-[500px]">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {userInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] text-gray-900 leading-tight">{userName}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            Just now · <span>🌐</span>
          </p>
        </div>
        <span className="text-gray-400 text-xl leading-none">···</span>
      </div>

      {/* Post text */}
      <p className="px-4 pb-3 text-[15px] text-gray-800 leading-snug whitespace-pre-wrap">{content}</p>

      {/* Photo placeholder */}
      <div className="bg-gray-100 h-48 flex items-center justify-center border-t border-b border-gray-200">
        <div className="text-center text-gray-300">
          <div className="text-5xl mb-1">🏠</div>
          <p className="text-xs">Listing Photo</p>
        </div>
      </div>

      {/* Reactions */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>👍</span><span>❤️</span>
          <span className="ml-1">24 people reacted</span>
        </div>
        <span className="text-sm text-gray-500">3 comments</span>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-200" />

      {/* Action buttons */}
      <div className="flex items-center px-2 py-1">
        {[
          { icon: '👍', label: 'Like' },
          { icon: '💬', label: 'Comment' },
          { icon: '↗️', label: 'Share' },
        ].map(({ icon, label }) => (
          <span
            key={label}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span className="text-base">{icon}</span> {label}
          </span>
        ))}
      </div>
    </div>
  )
}
