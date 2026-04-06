import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { handle, displayName, bio } = body

    // Validate handle uniqueness if provided
    if (handle) {
      const existingUser = await prisma.user.findUnique({
        where: { handle },
      })

      if (existingUser && existingUser.id !== session.userId) {
        return NextResponse.json({ error: "HANDLE_TAKEN", message: "Handle is already taken" }, { status: 409 })
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        handle: handle || null,
        displayName: displayName || null,
        bio: bio || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
    })
  } catch (error) {
    console.error("Profile update failed:", error)
    return NextResponse.json({ error: "UPDATE_FAILED", message: "Failed to update profile" }, { status: 500 })
  }
}
