import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export interface SessionData {
  userId?: string
  walletAddress?: string
  walletChain?: string
  isLoggedIn: boolean
  anonKey?: string
}

const defaultSession: SessionData = {
  isLoggedIn: false,
}

export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), {
    password: process.env.SESSION_SECRET!,
    cookieName: "fisidi-session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  })

  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn
  }

  return session
}

export async function requireAuth() {
  const session = await getSession()
  if (!session.isLoggedIn) {
    redirect("/connect-wallet")
  }
  return session
}

// Generate anonymous key for non-authenticated users
export function generateAnonKey(ip: string, userAgent: string): string {
  const crypto = require("crypto")
  const secret = process.env.ANON_SECRET || "fallback-secret"
  return crypto.createHmac("sha256", secret).update(`${ip}-${userAgent}-${Date.now()}`).digest("hex").substring(0, 16)
}
