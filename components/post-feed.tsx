"use client"

import { useState, useEffect } from "react"
import { EmbedCard } from "@/components/embed-card"
import { FeedTabs } from "@/components/feed-tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Loader2, RefreshCw } from "lucide-react"

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

interface PostFeedProps {
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onReport?: (postId: string) => void
  likedPosts?: Set<string>
}

export function PostFeed({ onLike, onComment, onReport, likedPosts = new Set() }: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeTab, setActiveTab] = useState("newest")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { toast } = useToast()

  const fetchPosts = async (tabValue: string, pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const response = await fetch(`/api/posts?sort=${tabValue}&page=${pageNum}&limit=10`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch posts")
      }

      if (append) {
        setPosts((prev) => [...prev, ...result.data.posts])
      } else {
        setPosts(result.data.posts)
      }

      setHasMore(result.data.hasMore)
      setPage(pageNum)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setPage(1)
    fetchPosts(tab, 1, false)
  }

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchPosts(activeTab, page + 1, true)
    }
  }

  const refresh = () => {
    setPage(1)
    fetchPosts(activeTab, 1, false)
  }

  useEffect(() => {
    fetchPosts(activeTab)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <FeedTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full max-w-2xl mx-auto">
              <div className="p-4 space-y-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="aspect-video w-full rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <FeedTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <p className="text-lg font-medium">No videos yet</p>
            <p className="text-sm">Be the first to share a video!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <EmbedCard
              key={post.id}
              post={post}
              onLike={onLike}
              onComment={onComment}
              onReport={onReport}
              isLiked={likedPosts.has(post.id)}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-6">
              <Button onClick={loadMore} disabled={loadingMore} variant="outline">
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
