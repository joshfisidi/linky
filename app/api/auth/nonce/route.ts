import { NextResponse } from "next/server"
import { generateNonce } from "siwe"

export async function GET() {
  try {
    const nonce = generateNonce()

    return NextResponse.json({
      success: true,
      data: { nonce },
    })
  } catch (error) {
    console.error("Nonce generation failed:", error)
    return NextResponse.json({ error: "NONCE_GENERATION_FAILED", message: "Failed to generate nonce" }, { status: 500 })
  }
}
