export default function AdminClientsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-9 w-28 bg-green-100 rounded-lg mb-2" />
          <div className="h-4 w-20 bg-green-50 rounded" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3 mb-6">
        <div className="h-9 flex-1 max-w-xs bg-green-50 rounded-lg" />
        <div className="h-9 w-28 bg-green-50 rounded-lg" />
        <div className="h-9 w-24 bg-green-50 rounded-lg" />
        <div className="h-9 w-28 bg-green-50 rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
        <div className="border-b border-reru-border px-6 py-3 grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 bg-green-50 rounded" />
          ))}
        </div>
        <div className="divide-y divide-reru-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-6 py-4 grid grid-cols-6 gap-4 items-center">
              <div>
                <div className="h-4 w-28 bg-green-50 rounded mb-1" />
                <div className="h-3 w-20 bg-green-50 rounded" />
              </div>
              <div className="h-4 w-16 bg-green-50 rounded" />
              <div className="h-4 w-16 bg-green-50 rounded" />
              <div className="h-6 w-16 bg-green-100 rounded-full" />
              <div className="h-4 w-20 bg-green-50 rounded" />
              <div className="h-4 w-16 bg-green-50 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
