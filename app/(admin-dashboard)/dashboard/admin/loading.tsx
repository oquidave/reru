export default function AdminOverviewLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-9 w-56 bg-green-100 rounded-lg mb-2" />
        <div className="h-5 w-40 bg-green-50 rounded" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white border border-reru-border rounded-xl p-5 shadow-card">
            <div className="w-9 h-9 rounded-lg bg-green-100 mb-3" />
            <div className="h-8 w-12 bg-green-100 rounded mb-1" />
            <div className="h-3 w-20 bg-green-50 rounded" />
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-reru-border rounded-xl p-5 shadow-card flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-green-100 rounded mb-1" />
              <div className="h-3 w-24 bg-green-50 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-reru-border">
          <div className="h-5 w-36 bg-green-100 rounded" />
        </div>
        <div className="divide-y divide-reru-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="h-4 flex-1 bg-green-50 rounded" />
              <div className="h-4 w-20 bg-green-50 rounded" />
              <div className="h-4 w-16 bg-green-50 rounded" />
              <div className="h-6 w-16 bg-green-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
