import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession, generateAnonKey } from "@/lib/auth"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { revalidateTag } from "next/cache"

// Simple profanity filter
const PROFANITY_WORDS = ["spam", "scam", "fake", "bot"] // Add more as needed
function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase()
  return PROFANITY_WORDS.some((word) => lowerText.includes(word))
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimitResult = rateLimit(identifier, 60, 60 * 60 * 1000) // 60 comments per hour

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "RATE_LIMIT_EXCEEDED", message: "Too many comments" },
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
    const { postId, body: commentBody } = body

    if (!postId || !commentBody || typeof commentBody !== "string") {
      return NextResponse.json({ error: "INVALID_REQUEST", message: "Invalid request parameters" }, { status: 400 })
    }

    // Validate comment length
    if (commentBody.length > 500) {
      return NextResponse.json(
        { error: "COMMENT_TOO_LONG", message: "Comment must be 500 characters or less" },
        { status: 400 },
      )
    }

    if (commentBody.trim().length === 0) {
      return NextResponse.json({ error: "EMPTY_COMMENT", message: "Comment cannot be empty" }, { status: 400 })
    }

    // Basic profanity filter
    if (containsProfanity(commentBody)) {
      return NextResponse.json(
        { error: "INAPPROPRIATE_CONTENT", message: "Comment contains inappropriate content" },
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

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        postId,
        body: commentBody.trim(),
        userId,
        anonKey,
      },
      include: {
        user: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Update comment count
    await prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    })

    // Revalidate posts cache
    revalidateTag("posts")

    return NextResponse.json({
      success: true,
      data: { comment },
    })
  } catch (error) {
    console.error("Comment creation failed:", error)
    return NextResponse.json({ error: "COMMENT_CREATION_FAILED", message: "Failed to create comment" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get("postId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (!postId) {
      return NextResponse.json({ error: "INVALID_REQUEST", message: "Post ID is required" }, { status: 400 })
    }

    const skip = (page - 1) * limit

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })

    const total = await prisma.comment.count({
      where: { postId },
    })

    return NextResponse.json({
      success: true,
      data: {
        comments,
        hasMore: comments.length === limit,
        page,
        total,
      },
    })
  } catch (error) {
    console.error("Failed to fetch comments:", error)
    return NextResponse.json({ error: "FETCH_FAILED", message: "Failed to fetch comments" }, { status: 500 })
  }
}
