import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession, generateAnonKey } from "@/lib/auth"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimitResult = rateLimit(identifier, 10, 60 * 60 * 1000) // 10 reports per hour

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "RATE_LIMIT_EXCEEDED", message: "Too many reports" },
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

    const session = await getSession()
    const body = await request.json()
    const { postId, reason, description } = body

    if (!postId || !reason) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Post ID and reason are required" },
        { status: 400 },
      )
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json({ error: "POST_NOT_FOUND", message: "Post not found" }, { status: 404 })
    }

    let reporterId = null
    let anonKey = null

    if (session.isLoggedIn && session.userId) {
      reporterId = session.userId
    } else {
      // Generate or get anonymous key
      if (!session.anonKey) {
        const userAgent = request.headers.get("user-agent") || "unknown"
        session.anonKey = generateAnonKey(identifier, userAgent)
        await session.save()
      }
      anonKey = session.anonKey
    }

    // Check for duplicate reports
    const existingReport = await prisma.report.findFirst({
      where: {
        postId,
        OR: [{ reporterId }, { anonKey }].filter(Boolean),
      },
    })

    if (existingReport) {
      return NextResponse.json(
        { error: "ALREADY_REPORTED", message: "You have already reported this post" },
        { status: 409 },
      )
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        postId,
        reason,
        description: description || null,
        reporterId,
        anonKey,
      },
    })

    return NextResponse.json({
      success: true,
      data: { reportId: report.id },
    })
  } catch (error) {
    console.error("Report creation failed:", error)
    return NextResponse.json({ error: "REPORT_CREATION_FAILED", message: "Failed to create report" }, { status: 500 })
  }
}
