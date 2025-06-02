import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Define which paths should be protected
const protectedPaths = [
  "/dashboard",
  "/products",
  "/suppliers",
  "/customers",
  "/sales",
  "/invoices",
  "/purchases",
  "/refunds",
  "/inventory",
  "/reports",
  "/settings",
]

// Define which paths should be public
const publicPaths = ["/login", "/register", "/auth", "/api/auth", "/_next", "/favicon.ico", "/images", "/fonts"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is public
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check if the path is protected
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    const token = await getToken({ req: request })

    // If not authenticated, redirect to login
    if (!token) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", encodeURI(request.url))
      return NextResponse.redirect(url)
    }
  }

  // For API routes, check authentication
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    const token = await getToken({ req: request })

    // If not authenticated, return 401
    if (!token) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

