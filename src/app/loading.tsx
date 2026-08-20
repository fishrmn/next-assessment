export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">
      <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
      <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-muted" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </main>
  )
}
