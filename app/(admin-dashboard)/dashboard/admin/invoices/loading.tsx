export default function AdminInvoicesLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-9 w-28 bg-green-100 rounded-lg mb-2" />
          <div className="h-4 w-32 bg-green-50 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-28 bg-green-50 rounded-lg" />
          <div className="h-9 w-36 bg-green-100 rounded-lg" />
        </div>
      </div>

      {/* Filter tabs skeleton */}
      <div className="flex gap-1 mb-6 border-b border-reru-border pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-20 bg-green-50 rounded-t" />
        ))}
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
              <div className="h-4 w-28 bg-green-50 rounded" />
              <div className="h-4 w-20 bg-green-50 rounded" />
              <div className="h-4 w-16 bg-green-50 rounded" />
              <div className="h-4 w-20 bg-green-50 rounded" />
              <div className="h-6 w-16 bg-green-100 rounded-full" />
              <div className="h-8 w-24 bg-green-50 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
