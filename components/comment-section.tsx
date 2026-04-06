"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Send, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"

interface Comment {
  id: string
  createdAt: string
  body: string
  user?: {
    id: string
    handle?: string
    displayName?: string
    avatarUrl?: string
  }
}

interface CommentSectionProps {
  postId: string
  initialCount?: number
}

export function CommentSection({ postId, initialCount = 0 }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [showComments, setShowComments] = useState(false)
  const { toast } = useToast()

  const fetchComments = async () => {
    if (loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/comment?postId=${postId}&limit=50`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch comments")
      }

      setComments(result.data.comments)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          body: newComment.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to post comment")
      }

      // Add new comment to the top of the list
      setComments((prev) => [result.data.comment, ...prev])
      setNewComment("")

      toast({
        title: "Success",
        description: "Comment posted successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0) {
      fetchComments()
    }
    setShowComments(!showComments)
  }

  return (
    <div className="space-y-4">
      {/* Comment toggle button */}
      <Button variant="ghost" onClick={handleToggleComments} className="text-sm">
        {showComments ? "Hide" : "Show"} Comments ({initialCount})
      </Button>

      {showComments && (
        <div className="space-y-4">
          {/* Comment composer */}
          <div className="space-y-3">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={500}
              rows={3}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{newComment.length}/500</span>
              <Button onClick={handleSubmitComment} disabled={!newComment.trim() || submitting} size="sm">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Comment
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Comments list */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user?.avatarUrl || "/placeholder.svg"} />
                        <AvatarFallback>
                          {comment.user?.displayName?.[0] || comment.user?.handle?.[0] || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {comment.user?.displayName || comment.user?.handle || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{comment.body}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
