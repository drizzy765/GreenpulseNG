/**
 * Skeleton Loader Component
 * Provides pulse animation for loading states
 */
export default function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
      aria-label="Loading..."
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card card-content">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-4 w-48" />
    </div>
  )
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          width={i === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  )
}

