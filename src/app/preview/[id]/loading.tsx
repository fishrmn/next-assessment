export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col gap-6 p-6">
      <div className="h-14 animate-pulse rounded-lg bg-muted" />
      <div className="h-72 animate-pulse rounded-lg bg-muted" />
      <div className="h-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-48 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}
