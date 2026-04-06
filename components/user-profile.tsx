"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { EmbedCard } from "@/components/embed-card"
import { useToast } from "@/hooks/use-toast"
import { Edit, Save, X, Video, Heart, MessageCircle } from "lucide-react"

interface User {
  id: string
  handle?: string
  displayName?: string
  bio?: string
  avatarUrl?: string
  walletAddress: string
  walletChain: string
  createdAt: string
  posts?: any[]
  likes?: any[]
  comments?: any[]
}

interface UserProfileProps {
  user: User
  isOwnProfile: boolean
}

export function UserProfile({ user, isOwnProfile }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    handle: user.handle || "",
    displayName: user.displayName || "",
    bio: user.bio || "",
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to update profile")
      }

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })

      setIsEditing(false)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      handle: user.handle || "",
      displayName: user.displayName || "",
      bio: user.bio || "",
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="text-lg">{user.displayName?.[0] || user.handle?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Display name"
                      value={editData.displayName}
                      onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                      maxLength={50}
                    />
                    <Input
                      placeholder="Handle (optional)"
                      value={editData.handle}
                      onChange={(e) => setEditData({ ...editData, handle: e.target.value })}
                      maxLength={30}
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold">{user.displayName || user.handle || "Anonymous User"}</h1>
                    {user.handle && user.displayName && <p className="text-muted-foreground">@{user.handle}</p>}
                  </>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {user.walletChain.replace("-", " ")}
                  </Badge>
                </div>
              </div>
            </div>
            {isOwnProfile && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={saving} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        {(user.bio || isEditing) && (
          <CardContent>
            {isEditing ? (
              <Textarea
                placeholder="Tell us about yourself..."
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                maxLength={200}
                rows={3}
              />
            ) : (
              <p className="text-muted-foreground">{user.bio}</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Posts ({user.posts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="likes" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Liked ({user.likes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Comments ({user.comments?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          {user.posts && user.posts.length > 0 ? (
            <div className="space-y-6">
              {user.posts.map((post) => (
                <EmbedCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="likes" className="space-y-6">
          {user.likes && user.likes.length > 0 ? (
            <div className="space-y-6">
              {user.likes.map((like) => (
                <EmbedCard key={like.id} post={like.post} isLiked={true} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No liked posts yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {user.comments && user.comments.length > 0 ? (
            <div className="space-y-4">
              {user.comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm">{comment.body}</p>
                      <div className="text-xs text-muted-foreground">
                        Commented on <span className="font-medium">{comment.post.title || "Untitled Video"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No comments yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
