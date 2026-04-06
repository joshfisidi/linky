import { type NextRequest, NextResponse } from "next/server"
import { resolveVideoMetadata } from "@/lib/oembed"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { validateUrl, isShadowBanned } from "@/lib/security"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimitResult = rateLimit(identifier, 30, 60 * 1000) // 30 requests per minute

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

    // Check if user is shadow banned
    const session = await getSession()
    const userIdentifier = session.walletAddress || session.anonKey || identifier

    if (isShadowBanned(userIdentifier)) {
      // Return fake success for shadow banned users
      return NextResponse.json({
        success: true,
        data: {
          provider: "unknown",
          providerId: "fake",
          title: "Video not available",
          normalizedUrl: "https://example.com",
        },
      })
    }

    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "INVALID_URL", message: "URL is required" }, { status: 400 })
    }

    const urlValidation = validateUrl(url)
    if (!urlValidation.isValid) {
      return NextResponse.json({ error: "INVALID_URL", message: urlValidation.reason }, { status: 400 })
    }

    // Resolve video metadata
    const metadata = await resolveVideoMetadata(url)

    return NextResponse.json({
      success: true,
      data: metadata,
    })
  } catch (error: any) {
    console.error("oEmbed resolution failed:", error)

    if (error.message === "UNSUPPORTED_PROVIDER") {
      return NextResponse.json(
        { error: "UNSUPPORTED_PROVIDER", message: "Video provider not supported" },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: "FETCH_FAILED", message: "Failed to resolve video metadata" }, { status: 500 })
  }
}
