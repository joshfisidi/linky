import type { NextRequest } from "next/server"

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// Simple in-memory rate limiting for development
// In production, use Redis/Upstash
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  identifier: string,
  limit = 20,
  windowMs: number = 60 * 60 * 1000, // 1 hour
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    // Reset window
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    }
  }

  if (current.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: current.resetTime,
    }
  }

  current.count++
  rateLimitStore.set(key, current)

  return {
    success: true,
    limit,
    remaining: limit - current.count,
    reset: current.resetTime,
  }
}

export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : request.ip || "unknown"
  return ip
}
