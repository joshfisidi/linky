interface OEmbedProvider {
  name: string
  url: string
  schemes: string[]
  endpoint: string
}

interface OEmbedResponse {
  type: string
  version: string
  title?: string
  author_name?: string
  author_url?: string
  provider_name?: string
  provider_url?: string
  cache_age?: number
  thumbnail_url?: string
  thumbnail_width?: number
  thumbnail_height?: number
  html?: string
  width?: number
  height?: number
}

interface VideoMetadata {
  provider: string
  providerId: string
  title?: string
  description?: string
  thumbnailUrl?: string
  embedHtml?: string
  oembedJson?: any
  normalizedUrl: string
}

// Allowlisted video providers
const PROVIDERS: OEmbedProvider[] = [
  {
    name: "youtube",
    url: "https://www.youtube.com/",
    schemes: ["https://*.youtube.com/watch*", "https://*.youtube.com/v/*", "https://youtu.be/*"],
    endpoint: "https://www.youtube.com/oembed",
  },
  {
    name: "vimeo",
    url: "https://vimeo.com/",
    schemes: ["https://vimeo.com/*", "https://vimeo.com/groups/*/videos/*"],
    endpoint: "https://vimeo.com/api/oembed.json",
  },
  {
    name: "tiktok",
    url: "https://www.tiktok.com/",
    schemes: ["https://www.tiktok.com/*/video/*"],
    endpoint: "https://www.tiktok.com/oembed",
  },
]

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)

    // YouTube normalization
    if (parsed.hostname.includes("youtube.com") || parsed.hostname === "youtu.be") {
      let videoId = ""
      if (parsed.hostname === "youtu.be") {
        videoId = parsed.pathname.slice(1)
      } else {
        videoId = parsed.searchParams.get("v") || ""
      }
      return `https://www.youtube.com/watch?v=${videoId}`
    }

    // Vimeo normalization
    if (parsed.hostname.includes("vimeo.com")) {
      const videoId = parsed.pathname.split("/").pop()
      return `https://vimeo.com/${videoId}`
    }

    // TikTok normalization
    if (parsed.hostname.includes("tiktok.com")) {
      return parsed.href
    }

    return parsed.href
  } catch {
    throw new Error("Invalid URL")
  }
}

export function extractProviderId(url: string, provider: string): string {
  const parsed = new URL(url)

  switch (provider) {
    case "youtube":
      if (parsed.hostname === "youtu.be") {
        return parsed.pathname.slice(1)
      }
      return parsed.searchParams.get("v") || ""

    case "vimeo":
      return parsed.pathname.split("/").pop() || ""

    case "tiktok":
      const match = parsed.pathname.match(/\/video\/(\d+)/)
      return match ? match[1] : ""

    default:
      return ""
  }
}

export function getProviderForUrl(url: string): string | null {
  for (const provider of PROVIDERS) {
    for (const scheme of provider.schemes) {
      const regex = new RegExp(scheme.replace(/\*/g, ".*"))
      if (regex.test(url)) {
        return provider.name
      }
    }
  }
  return null
}

export async function resolveVideoMetadata(url: string): Promise<VideoMetadata> {
  const normalizedUrl = normalizeUrl(url)
  const provider = getProviderForUrl(normalizedUrl)

  if (!provider) {
    throw new Error("UNSUPPORTED_PROVIDER")
  }

  const providerId = extractProviderId(normalizedUrl, provider)
  const providerConfig = PROVIDERS.find((p) => p.name === provider)!

  try {
    // Try oEmbed first
    const oembedUrl = `${providerConfig.endpoint}?url=${encodeURIComponent(normalizedUrl)}&format=json`
    const response = await fetch(oembedUrl, {
      headers: {
        "User-Agent": "Fisidi/1.0",
      },
    })

    if (response.ok) {
      const oembed: OEmbedResponse = await response.json()

      return {
        provider,
        providerId,
        title: oembed.title,
        thumbnailUrl: oembed.thumbnail_url,
        embedHtml: oembed.html,
        oembedJson: oembed,
        normalizedUrl,
      }
    }
  } catch (error) {
    console.error("oEmbed failed:", error)
  }

  // Fallback to basic metadata
  return {
    provider,
    providerId,
    normalizedUrl,
  }
}
