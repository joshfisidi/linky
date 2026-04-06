import { getSession } from "@/lib/auth"

// Admin user wallet addresses (in production, store in database)
const ADMIN_ADDRESSES = new Set([
  // Add admin wallet addresses here
  "0x1234567890123456789012345678901234567890", // Example admin address
])

export async function isAdmin(): Promise<boolean> {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || !session.walletAddress) {
      return false
    }

    return ADMIN_ADDRESSES.has(session.walletAddress.toLowerCase())
  } catch {
    return false
  }
}

export async function requireAdmin() {
  const adminStatus = await isAdmin()
  if (!adminStatus) {
    throw new Error("Admin access required")
  }
}
