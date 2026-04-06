import { type NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { rateLimit } from "@/lib/rate-limit"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers (already in next.config.mjs, but adding as backup)
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const identifier = request.ip || "unknown"
    const rateLimitResult = rateLimit(identifier, 100, 60 * 1000) // 100 requests per minute

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "RATE_LIMIT_EXCEEDED", message: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        },
      )
    }
  }

  // Admin route protection
  if (request.nextUrl.pathname.startsWith("/admin/")) {
    try {
      const session = await getIronSession(request.cookies, response.cookies, {
        password: process.env.SESSION_SECRET!,
        cookieName: "fisidi-session",
      })

      // Simple admin check (in production, verify against database)
      const adminAddresses = ["0x1234567890123456789012345678901234567890"] // Example
      const isAdmin = session.walletAddress && adminAddresses.includes(session.walletAddress.toLowerCase())

      if (!isAdmin) {
        return NextResponse.redirect(new URL("/", request.url))
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return response
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
