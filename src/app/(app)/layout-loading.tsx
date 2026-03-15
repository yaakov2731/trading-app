/**
 * app/(app)/layout-loading.tsx
 * Layout-level loading shell used for app shell transitions.
 */

import { Skeleton } from '@/components/feedback/loading-state'

export default function LayoutLoading() {
  return (
    <div className="min-h-screen bg-slate-950 animate-pulse">
      {/* Nav skeleton */}
      <div className="h-14 border-b border-slate-800 flex items-center px-4 gap-4">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-32 h-4" />
        <div className="flex-1" />
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  )
}
