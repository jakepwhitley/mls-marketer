interface GroupchatBubbleProps {
  content: string
  userName: string
  userInitials: string
}

export function GroupchatBubble({ content, userName, userInitials }: GroupchatBubbleProps) {
  return (
    <div className="rounded-xl overflow-hidden shadow-md max-w-[380px] font-sans" style={{ backgroundColor: '#1c1c1e' }}>
      {/* Group chat header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center justify-center mb-2">
          {/* Stacked avatars */}
          <div className="flex -space-x-2">
            {['JW', 'SR', 'MK'].map((initials, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                style={{
                  backgroundColor: ['#0a84ff', '#30d158', '#ff453a'][i],
                  borderColor: '#1c1c1e',
                }}
              >
                {initials}
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-white text-sm font-semibold">Realtor Network 🏠</p>
        <p className="text-center text-white/50 text-xs mt-0.5">3 members</p>
      </div>

      {/* Message */}
      <div className="px-4 py-4">
        <div className="flex items-end gap-2">
          {/* Sender avatar */}
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {userInitials}
          </div>

          {/* Bubble */}
          <div className="max-w-[260px]">
            <p className="text-white/60 text-xs mb-1 ml-1">{userName}</p>
            <div className="rounded-2xl rounded-bl-sm px-4 py-2.5" style={{ backgroundColor: '#3a3a3c' }}>
              <p className="text-white text-sm leading-relaxed">{content}</p>
            </div>
          </div>
        </div>

        {/* Timestamp + delivered */}
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-white/30 text-xs">Just now</p>
          <p className="text-white/30 text-xs">Delivered ✓</p>
        </div>
      </div>
    </div>
  )
}
