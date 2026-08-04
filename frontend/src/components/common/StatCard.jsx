export default function StatCard({ title, value, icon: Icon, color, sub }) {
  const colors = {
    blue:   { bg: 'bg-blue-500/10',   icon: 'text-blue-400',   border: 'border-blue-500/20' },
    green:  { bg: 'bg-green-500/10',  icon: 'text-green-400',  border: 'border-green-500/20' },
    yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-400', border: 'border-yellow-500/20' },
    red:    { bg: 'bg-red-500/10',    icon: 'text-red-400',    border: 'border-red-500/20' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
  }
  const c = colors[color] || colors.blue

  return (
    <div className={`card flex items-center gap-4 border ${c.border}`}>
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`${c.icon} text-2xl`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide truncate">
          {title}
        </p>
        <p className="text-white text-2xl font-bold mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
