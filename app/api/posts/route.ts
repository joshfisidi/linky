import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const sort = searchParams.get("sort") || "newest" // newest, hot, rising

    const skip = (page - 1) * limit

    let orderBy: any = { createdAt: "desc" } // Default: newest

    if (sort === "hot") {
      // Hot: combination of likes and recency (last 24h weighted)
      orderBy = [{ likeCount: "desc" }, { createdAt: "desc" }]
    } else if (sort === "rising") {
      // Rising: posts from last 7 days with good engagement
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const posts = await prisma.post.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
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
        orderBy: [{ likeCount: "desc" }, { commentCount: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      })

      return NextResponse.json({
        success: true,
        data: {
          posts,
          hasMore: posts.length === limit,
          page,
          total: posts.length,
        },
      })
    }

    const posts = await prisma.post.findMany({
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
      orderBy,
      skip,
      take: limit,
    })

    const total = await prisma.post.count()

    return NextResponse.json({
      success: true,
      data: {
        posts,
        hasMore: posts.length === limit,
        page,
        total,
      },
    })
  } catch (error) {
    console.error("Failed to fetch posts:", error)
    return NextResponse.json({ error: "FETCH_FAILED", message: "Failed to fetch posts" }, { status: 500 })
  }
}
