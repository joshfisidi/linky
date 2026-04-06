import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/admin"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "OPEN"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const skip = (page - 1) * limit

    const reports = await prisma.report.findMany({
      where: { status },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                handle: true,
                displayName: true,
                walletAddress: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })

    const total = await prisma.report.count({
      where: { status },
    })

    return NextResponse.json({
      success: true,
      data: {
        reports,
        hasMore: reports.length === limit,
        page,
        total,
      },
    })
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Admin access required" }, { status: 403 })
    }

    console.error("Failed to fetch reports:", error)
    return NextResponse.json({ error: "FETCH_FAILED", message: "Failed to fetch reports" }, { status: 500 })
  }
}
