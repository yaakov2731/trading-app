import { TableSkeleton, CardGridSkeleton, Skeleton } from '@/components/feedback/loading-state'

export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-slate-950 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-14 rounded-xl" />
        <CardGridSkeleton count={4} />
        <TableSkeleton rows={10} cols={6} />
      </div>
    </div>
  )
}
