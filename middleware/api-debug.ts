import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  console.log(`[API Request] ${request.method} ${request.nextUrl.pathname}`)

  // Continue to the API route
  const response = NextResponse.next()

  // Add a response handler to log the response status
  response.headers.append("x-middleware-cache", "no-cache")

  return response
}

export const config = {
  matcher: "/api/:path*",
}
