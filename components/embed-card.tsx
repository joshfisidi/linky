"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CommentSection } from "@/components/comment-section"
import { ReportDialog } from "@/components/report-dialog"
import { useToast } from "@/hooks/use-toast"
import { Heart, MessageCircle, ExternalLink, Play, Flag } from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"

interface Post {
  id: string
  createdAt: string
  originalUrl: string
  normalizedUrl: string
  provider: string
  title?: string
  description?: string
  thumbnailUrl?: string
  embedHtml?: string
  likeCount: number
  commentCount: number
  author?: {
    id: string
    handle?: string
    displayName?: string
    avatarUrl?: string
  }
}

interface EmbedCardProps {
  post: Post
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onReport?: (postId: string) => void
  isLiked?: boolean
}

export function EmbedCard({ post, onLike, onComment, onReport, isLiked = false }: EmbedCardProps) {
  const [showEmbed, setShowEmbed] = useState(false)
  const [liked, setLiked] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [likingInProgress, setLikingInProgress] = useState(false)
  const { toast } = useToast()

  const handleLike = async () => {
    if (likingInProgress) return

    setLikingInProgress(true)
    const action = liked ? "unlike" : "like"

    try {
      const response = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, action }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to process like")
      }

      // Update local state
      setLiked(!liked)
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1))

      onLike?.(post.id)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLikingInProgress(false)
    }
  }

  const handleComment = () => {
    onComment?.(post.id)
  }

  const handleReport = () => {
    onReport?.(post.id)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-4 space-y-4">
        {/* Author info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.author?.avatarUrl || "/placeholder.svg"} />
              <AvatarFallback>{post.author?.displayName?.[0] || post.author?.handle?.[0] || "A"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {post.author?.displayName || post.author?.handle || "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          <Badge variant="secondary" className="capitalize">
            {post.provider}
          </Badge>
        </div>

        {/* Video content */}
        <div className="space-y-3">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
            {showEmbed && post.embedHtml ? (
              <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: post.embedHtml }} />
            ) : (
              <div className="relative w-full h-full cursor-pointer" onClick={() => setShowEmbed(true)}>
                {post.thumbnailUrl ? (
                  <img
                    src={post.thumbnailUrl || "/placeholder.svg"}
                    alt={post.title || "Video thumbnail"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Play className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                  <div className="bg-white/90 rounded-full p-3 hover:bg-white transition-colors">
                    <Play className="h-8 w-8 text-black" />
                  </div>
                </div>
              </div>
            )}
          </AspectRatio>

          {/* Title and description */}
          {post.title && <h3 className="font-medium text-base line-clamp-2 leading-tight">{post.title}</h3>}

          {post.description && <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likingInProgress}
              className={`gap-2 ${liked ? "text-red-500 hover:text-red-600" : ""}`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {likeCount}
            </Button>

            <Button variant="ghost" size="sm" onClick={handleComment} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              {post.commentCount}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href={post.normalizedUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View
              </a>
            </Button>

            <ReportDialog postId={post.id}>
              <Button variant="ghost" size="sm">
                <Flag className="h-4 w-4" />
              </Button>
            </ReportDialog>
          </div>
        </div>

        {/* Comments section */}
        <CommentSection postId={post.id} initialCount={post.commentCount} />
      </CardContent>
    </Card>
  )
}
