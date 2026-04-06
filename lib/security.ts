// Domain reputation and security utilities

interface DomainReputation {
  domain: string
  score: number // 0-100, higher is better
  isBlocked: boolean
  lastChecked: Date
}

// Blocked domains list (can be expanded)
const BLOCKED_DOMAINS = new Set(["malicious-site.com", "spam-domain.net", "fake-videos.org"])

// Suspicious patterns in URLs
const SUSPICIOUS_PATTERNS = [/bit\.ly/i, /tinyurl/i, /t\.co/i, /shortened/i, /redirect/i]

export function isDomainBlocked(url: string): boolean {
  try {
    const domain = new URL(url).hostname.toLowerCase()
    return BLOCKED_DOMAINS.has(domain)
  } catch {
    return true // Invalid URLs are blocked
  }
}

export function getDomainReputation(url: string): number {
  try {
    const domain = new URL(url).hostname.toLowerCase()

    // Check if domain is blocked
    if (BLOCKED_DOMAINS.has(domain)) {
      return 0
    }

    // Check for suspicious patterns
    const hasSuspiciousPattern = SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(url))
    if (hasSuspiciousPattern) {
      return 30 // Low reputation for suspicious URLs
    }

    // Known good domains get high scores
    const trustedDomains = ["youtube.com", "youtu.be", "vimeo.com", "tiktok.com"]

    if (trustedDomains.some((trusted) => domain.includes(trusted))) {
      return 100
    }

    // Default reputation for unknown domains
    return 70
  } catch {
    return 0 // Invalid URLs get 0 reputation
  }
}

export function validateUrl(url: string): { isValid: boolean; reason?: string } {
  try {
    const parsed = new URL(url)

    // Must be HTTPS
    if (parsed.protocol !== "https:") {
      return { isValid: false, reason: "URL must use HTTPS" }
    }

    // Check blocked domains
    if (isDomainBlocked(url)) {
      return { isValid: false, reason: "Domain is blocked" }
    }

    // Check reputation
    const reputation = getDomainReputation(url)
    if (reputation < 50) {
      return { isValid: false, reason: "Domain has low reputation score" }
    }

    return { isValid: true }
  } catch {
    return { isValid: false, reason: "Invalid URL format" }
  }
}

// Shadow ban system
const shadowBannedKeys = new Set<string>()

export function shadowBanUser(identifier: string) {
  shadowBannedKeys.add(identifier)
}

export function isShadowBanned(identifier: string): boolean {
  return shadowBannedKeys.has(identifier)
}

export function removeShadowBan(identifier: string) {
  shadowBannedKeys.delete(identifier)
}
