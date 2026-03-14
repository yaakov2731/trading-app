import { CardGridSkeleton, TableSkeleton, Skeleton } from '@/components/feedback/loading-state'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <CardGridSkeleton count={4} />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TableSkeleton rows={6} cols={4} />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
