"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Play, ExternalLink } from "lucide-react"

interface VideoMetadata {
  provider: string
  providerId: string
  title?: string
  description?: string
  thumbnailUrl?: string
  embedHtml?: string
  normalizedUrl: string
}

export function PostComposer({ onPostCreated }: { onPostCreated?: () => void }) {
  const [url, setUrl] = useState("")
  const [isResolving, setIsResolving] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [preview, setPreview] = useState<VideoMetadata | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleResolve = async () => {
    if (!url.trim()) return

    setIsResolving(true)
    setError(null)
    setPreview(null)

    try {
      const response = await fetch("/api/oembed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to resolve video")
      }

      setPreview(result.data)
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsResolving(false)
    }
  }

  const handlePost = async () => {
    if (!preview) return

    setIsPosting(true)

    try {
      const response = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === "DUPLICATE_POST") {
          toast({
            title: "Already Posted",
            description: "This video has already been shared on Fisidi",
            variant: "destructive",
          })
          return
        }
        throw new Error(result.message || "Failed to create post")
      }

      toast({
        title: "Success",
        description: "Video posted successfully!",
      })

      // Reset form
      setUrl("")
      setPreview(null)
      setError(null)
      onPostCreated?.()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Share a Video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Paste a video URL (YouTube, Vimeo, TikTok...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleResolve()}
            className="flex-1"
          />
          <Button onClick={handleResolve} disabled={!url.trim() || isResolving} variant="outline">
            {isResolving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preview"}
          </Button>
        </div>

        {isResolving && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <AspectRatio ratio={16 / 9}>
                  <Skeleton className="w-full h-full rounded-md" />
                </AspectRatio>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {preview && (
          <Card className="border-2 border-primary/20">
            <CardContent className="p-4">
              <div className="space-y-3">
                <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
                  {preview.thumbnailUrl ? (
                    <div className="relative w-full h-full">
                      <img
                        src={preview.thumbnailUrl || "/placeholder.svg"}
                        alt={preview.title || "Video thumbnail"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play className="h-12 w-12 text-white opacity-80" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Play className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </AspectRatio>

                <div className="space-y-2">
                  <h3 className="font-medium text-sm line-clamp-2">{preview.title || "Untitled Video"}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize bg-secondary px-2 py-1 rounded">{preview.provider}</span>
                    <a
                      href={preview.normalizedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Original
                    </a>
                  </div>
                </div>

                <Button onClick={handlePost} disabled={isPosting} className="w-full">
                  {isPosting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Posting...
                    </>
                  ) : (
                    "Post to Fisidi"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
      </CardContent>
    </Card>
  )
}
