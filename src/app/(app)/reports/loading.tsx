import { CardGridSkeleton, Skeleton } from '@/components/feedback/loading-state'

export default function ReportsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-7 w-40" />
        <CardGridSkeleton count={4} />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  )
}
