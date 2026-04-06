import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveVideoMetadata } from "@/lib/oembed"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { revalidateTag } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimitResult = rateLimit(identifier, 20, 60 * 60 * 1000) // 20 posts per hour

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "RATE_LIMIT_EXCEEDED", message: "Too many posts" },
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
    const { url } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "INVALID_URL", message: "URL is required" }, { status: 400 })
    }

    // Resolve video metadata
    const metadata = await resolveVideoMetadata(url)

    // Check for duplicate posts
    const existingPost = await prisma.post.findUnique({
      where: {
        provider_providerId: {
          provider: metadata.provider,
          providerId: metadata.providerId,
        },
      },
    })

    if (existingPost) {
      return NextResponse.json(
        { error: "DUPLICATE_POST", message: "This video has already been posted", postId: existingPost.id },
        { status: 409 },
      )
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        originalUrl: url,
        normalizedUrl: metadata.normalizedUrl,
        provider: metadata.provider,
        providerId: metadata.providerId,
        title: metadata.title,
        description: metadata.description,
        thumbnailUrl: metadata.thumbnailUrl,
        embedHtml: metadata.embedHtml,
        oembedJson: metadata.oembedJson,
        authorId: session.isLoggedIn ? session.userId : null,
      },
      include: {
        author: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Revalidate feed cache
    revalidateTag("posts")

    return NextResponse.json({
      success: true,
      data: { id: post.id, post },
    })
  } catch (error: any) {
    console.error("Post creation failed:", error)

    if (error.message === "UNSUPPORTED_PROVIDER") {
      return NextResponse.json(
        { error: "UNSUPPORTED_PROVIDER", message: "Video provider not supported" },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: "POST_CREATION_FAILED", message: "Failed to create post" }, { status: 500 })
  }
}
