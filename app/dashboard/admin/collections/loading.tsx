export default function AdminCollectionsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-9 w-36 bg-green-100 rounded-lg" />
        <div className="flex gap-3">
          <div className="h-9 w-52 bg-green-50 rounded-lg" />
          <div className="h-9 w-40 bg-green-50 rounded-lg" />
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-reru-border rounded-xl px-5 py-3 shadow-card flex items-center gap-3">
            <div className="h-7 w-7 bg-green-100 rounded" />
            <div className="h-3 w-16 bg-green-50 rounded" />
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-reru-border rounded-xl shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-reru-border">
              <div className="h-5 w-20 bg-green-100 rounded" />
            </div>
            <div className="divide-y divide-reru-border">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-green-50 rounded mb-1" />
                    <div className="h-3 w-24 bg-green-50 rounded" />
                  </div>
                  <div className="h-4 w-24 bg-green-50 rounded" />
                  <div className="h-6 w-20 bg-green-100 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
