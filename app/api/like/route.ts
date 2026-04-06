import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession, generateAnonKey } from "@/lib/auth"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { revalidateTag } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimitResult = rateLimit(identifier, 120, 60 * 60 * 1000) // 120 likes per hour

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "RATE_LIMIT_EXCEEDED", message: "Too many likes" },
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
    const { postId, action } = body

    if (!postId || !action || !["like", "unlike"].includes(action)) {
      return NextResponse.json({ error: "INVALID_REQUEST", message: "Invalid request parameters" }, { status: 400 })
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json({ error: "POST_NOT_FOUND", message: "Post not found" }, { status: 404 })
    }

    let userId = null
    let anonKey = null

    if (session.isLoggedIn && session.userId) {
      userId = session.userId
    } else {
      // Generate or get anonymous key
      if (!session.anonKey) {
        const userAgent = request.headers.get("user-agent") || "unknown"
        session.anonKey = generateAnonKey(identifier, userAgent)
        await session.save()
      }
      anonKey = session.anonKey
    }

    if (action === "like") {
      // Check if already liked
      const existingLike = await prisma.like.findFirst({
        where: {
          postId,
          OR: [{ userId }, { anonKey }].filter(Boolean),
        },
      })

      if (existingLike) {
        return NextResponse.json({ error: "ALREADY_LIKED", message: "Already liked this post" }, { status: 409 })
      }

      // Create like
      await prisma.like.create({
        data: {
          postId,
          userId,
          anonKey,
        },
      })

      // Update like count
      await prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      })
    } else {
      // Unlike
      const deletedLike = await prisma.like.deleteMany({
        where: {
          postId,
          OR: [{ userId }, { anonKey }].filter(Boolean),
        },
      })

      if (deletedLike.count === 0) {
        return NextResponse.json({ error: "NOT_LIKED", message: "Post not liked" }, { status: 409 })
      }

      // Update like count
      await prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      })
    }

    // Revalidate posts cache
    revalidateTag("posts")

    return NextResponse.json({
      success: true,
      data: { action, postId },
    })
  } catch (error) {
    console.error("Like operation failed:", error)
    return NextResponse.json({ error: "OPERATION_FAILED", message: "Failed to process like" }, { status: 500 })
  }
}
