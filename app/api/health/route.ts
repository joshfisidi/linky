import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const startTime = Date.now()

    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - startTime

    // Get basic stats
    const stats = await Promise.all([
      prisma.post.count(),
      prisma.user.count(),
      prisma.like.count(),
      prisma.comment.count(),
    ])

    const [postCount, userCount, likeCount, commentCount] = stats

    // Test provider reachability (simplified)
    const providerTests = await Promise.allSettled([
      fetch("https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=json", {
        signal: AbortSignal.timeout(5000),
      }),
      fetch("https://vimeo.com/api/oembed.json?url=https://vimeo.com/1", {
        signal: AbortSignal.timeout(5000),
      }),
    ])

    const providerStatus = {
      youtube: providerTests[0].status === "fulfilled" && providerTests[0].value.ok,
      vimeo: providerTests[1].status === "fulfilled" && providerTests[1].value.ok,
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      buildId: process.env.VERCEL_GIT_COMMIT_SHA || "development",
      database: {
        connected: true,
        latency: `${dbLatency}ms`,
      },
      stats: {
        posts: postCount,
        users: userCount,
        likes: likeCount,
        comments: commentCount,
      },
      providers: providerStatus,
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 500 },
    )
  }
}
