interface InstagramPostProps {
  content: string
  userName: string
  userInitials: string
}

export function InstagramPost({ content, userName, userInitials }: InstagramPostProps) {
  const handle = userName.toLowerCase().replace(/\s+/g, '')

  // Split hashtags from caption body
  const lines = content.split('\n')
  const hashtagLine = lines.find(l => l.trim().startsWith('#')) ?? ''
  const captionBody = lines.filter(l => !l.trim().startsWith('#')).join('\n').trim()
  const hashtags = hashtagLine.split(' ').filter(t => t.startsWith('#'))

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden max-w-[400px] font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {userInitials}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900">{handle}</p>
        </div>
        <span className="text-gray-800 font-bold text-lg leading-none">···</span>
      </div>

      {/* Photo placeholder */}
      <div className="bg-gray-100 aspect-square flex items-center justify-center">
        <div className="text-center text-gray-300">
          <div className="text-6xl mb-2">🏠</div>
          <p className="text-xs">Listing Photo</p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 pb-1 flex items-center">
        <div className="flex items-center gap-4 flex-1">
          <span className="text-2xl">🤍</span>
          <span className="text-2xl">💬</span>
          <span className="text-2xl">✈️</span>
        </div>
        <span className="text-2xl">🔖</span>
      </div>

      {/* Likes */}
      <p className="px-4 text-sm font-semibold text-gray-900">47 likes</p>

      {/* Caption */}
      <div className="px-4 pt-1 pb-3 text-sm text-gray-900">
        <span className="font-semibold mr-1">{handle}</span>
        <span className="whitespace-pre-wrap">{captionBody}</span>
        {hashtags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {hashtags.map(tag => (
              <span key={tag} className="text-blue-500">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <p className="px-4 pb-3 text-[10px] uppercase tracking-widest text-gray-400">2 hours ago</p>
    </div>
  )
}
