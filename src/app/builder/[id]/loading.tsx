export default function Loading() {
  return (
    <div className="flex min-h-dvh w-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <div className="size-7 animate-pulse rounded-md bg-muted" />
        <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
        <div className="ml-auto h-8 w-24 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="flex-1 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="hidden border-r p-4 lg:block">
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="bg-muted/50 p-8">
          <div className="mx-auto h-[60dvh] max-w-5xl animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="hidden border-l p-4 lg:block">
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  )
}
