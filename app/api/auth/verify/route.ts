import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { verifySiweMessage, parseSiweMessage } from "@/lib/siwe"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const body = await request.json()
    const { message, signature } = body

    if (!message || !signature) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Message and signature are required" },
        { status: 400 },
      )
    }

    // Verify the SIWE message
    const isValid = await verifySiweMessage(message, signature)

    if (!isValid) {
      return NextResponse.json({ error: "INVALID_SIGNATURE", message: "Invalid signature" }, { status: 401 })
    }

    // Parse the message to get wallet details
    const siweMessage = parseSiweMessage(message)
    const walletAddress = siweMessage.address.toLowerCase()
    const chainId = siweMessage.chainId

    // Determine chain name
    let walletChain = "bsc"
    if (chainId === 97) {
      walletChain = "bsc-testnet"
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          walletAddress,
          walletChain,
        },
      })
    }

    // Migrate anonymous interactions if they exist
    if (session.anonKey) {
      await migrateAnonymousInteractions(session.anonKey, user.id)
    }

    // Update session
    session.isLoggedIn = true
    session.userId = user.id
    session.walletAddress = walletAddress
    session.walletChain = walletChain
    session.anonKey = undefined // Clear anonymous key
    await session.save()

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          handle: user.handle,
          displayName: user.displayName,
          walletAddress: user.walletAddress,
          walletChain: user.walletChain,
        },
      },
    })
  } catch (error) {
    console.error("Auth verification failed:", error)
    return NextResponse.json(
      { error: "VERIFICATION_FAILED", message: "Failed to verify authentication" },
      { status: 500 },
    )
  }
}

async function migrateAnonymousInteractions(anonKey: string, userId: string) {
  try {
    // Migrate likes
    await prisma.like.updateMany({
      where: { anonKey },
      data: { userId, anonKey: null },
    })

    // Migrate comments
    await prisma.comment.updateMany({
      where: { anonKey },
      data: { userId, anonKey: null },
    })

    // Migrate posts
    await prisma.post.updateMany({
      where: { authorId: null },
      data: { authorId: userId },
    })

    // Migrate reports
    await prisma.report.updateMany({
      where: { anonKey },
      data: { reporterId: userId, anonKey: null },
    })

    console.log(`Migrated anonymous interactions for anonKey: ${anonKey} to userId: ${userId}`)
  } catch (error) {
    console.error("Failed to migrate anonymous interactions:", error)
  }
}
