import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    // Clear session
    session.isLoggedIn = false
    session.userId = undefined
    session.walletAddress = undefined
    session.walletChain = undefined
    await session.save()

    // Redirect to home
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000"))
  } catch (error) {
    console.error("Logout failed:", error)
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000"))
  }
}
