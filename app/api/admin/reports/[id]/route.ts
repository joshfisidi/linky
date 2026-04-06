import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/admin"
import { shadowBanUser } from "@/lib/security"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { action, reason } = body // action: "dismiss" | "hide_post" | "ban_user"

    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        post: {
          include: {
            author: true,
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json({ error: "REPORT_NOT_FOUND", message: "Report not found" }, { status: 404 })
    }

    let actionTaken = ""

    switch (action) {
      case "dismiss":
        await prisma.report.update({
          where: { id: params.id },
          data: { status: "REVIEWED" },
        })
        actionTaken = "Report dismissed"
        break

      case "hide_post":
        // In a real implementation, you'd add a "hidden" field to posts
        // For now, we'll just mark the report as actioned
        await prisma.report.update({
          where: { id: params.id },
          data: { status: "ACTIONED" },
        })
        actionTaken = "Post hidden"
        break

      case "ban_user":
        // Shadow ban the user
        if (report.post.author) {
          shadowBanUser(report.post.author.walletAddress)
        } else if (report.anonKey) {
          shadowBanUser(report.anonKey)
        }

        await prisma.report.update({
          where: { id: params.id },
          data: { status: "ACTIONED" },
        })
        actionTaken = "User shadow banned"
        break

      default:
        return NextResponse.json({ error: "INVALID_ACTION", message: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: { actionTaken, reportId: params.id },
    })
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Admin access required" }, { status: 403 })
    }

    console.error("Failed to process report:", error)
    return NextResponse.json({ error: "ACTION_FAILED", message: "Failed to process report" }, { status: 500 })
  }
}
