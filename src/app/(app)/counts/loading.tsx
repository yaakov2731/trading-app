import { TableSkeleton, Skeleton } from '@/components/feedback/loading-state'

export default function CountsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 animate-pulse">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <TableSkeleton rows={6} cols={5} />
      </div>
    </div>
  )
}
