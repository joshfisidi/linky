import { SiweMessage } from "siwe"

export function createSiweMessage(address: string, chainId: number, nonce: string): string {
  const domain = process.env.NEXT_PUBLIC_DOMAIN || "localhost:3000"
  const origin = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000"

  const message = new SiweMessage({
    domain,
    address,
    statement: "Sign in to Fisidi with your wallet",
    uri: origin,
    version: "1",
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
  })

  return message.prepareMessage()
}

export function parseSiweMessage(message: string): SiweMessage {
  return new SiweMessage(message)
}

export async function verifySiweMessage(message: string, signature: string): Promise<boolean> {
  try {
    const siweMessage = new SiweMessage(message)
    const result = await siweMessage.verify({ signature })
    return result.success
  } catch (error) {
    console.error("SIWE verification failed:", error)
    return false
  }
}
