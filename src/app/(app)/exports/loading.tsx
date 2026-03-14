import { ListSkeleton, Skeleton } from '@/components/feedback/loading-state'

export default function ExportsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <Skeleton className="h-7 w-44" />
        <div className="grid sm:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-5 w-32" />
        <ListSkeleton rows={4} />
      </div>
    </div>
  )
}
