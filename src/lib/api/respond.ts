import { NextResponse } from "next/server"

import { AppError, ValidationError } from "@/lib/errors"

export function ok<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status })
}

export function fail(error: unknown): NextResponse {
  if (error instanceof AppError) {
    const issues = error instanceof ValidationError ? error.issues : undefined
    return NextResponse.json({ error: error.message, issues }, { status: error.statusCode })
  }

  console.error("Unhandled route error:", error)
  return NextResponse.json({ error: "Internal server error" }, { status: 500 })
}

export function withErrorHandling<C>(handler: (request: Request, context: C) => Promise<NextResponse>) {
  return async (request: Request, context: C): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      return fail(error)
    }
  }
}
