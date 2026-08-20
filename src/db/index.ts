import "server-only"

/**
 * Server-side database entry point. Import from `@/db` in Server Components,
 * Route Handlers, and Server Actions only — `server-only` turns any client
 * bundle import into a build error.
 */
export * from "./client"
export * from "./queries"
export * from "./types"
