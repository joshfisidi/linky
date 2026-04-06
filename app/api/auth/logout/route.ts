import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    // Clear session
    session.isLoggedIn = false
    session.userId = undefined
    session.walletAddress = undefined
    session.walletChain = undefined
    await session.save()

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("Logout failed:", error)
    return NextResponse.json({ error: "LOGOUT_FAILED", message: "Failed to logout" }, { status: 500 })
  }
}
