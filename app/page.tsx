import { Suspense } from "react"
import { getSession } from "@/lib/auth"
import { Navigation } from "@/components/navigation"
import { PostComposer } from "@/components/post-composer"
import { PostFeed } from "@/components/post-feed"
import { Separator } from "@/components/ui/separator"

export default async function HomePage() {
  const session = await getSession()

  // If user is logged in, fetch their profile
  let user = null
  if (session.isLoggedIn && session.userId) {
    // In a real app, you'd fetch user data here
    user = {
      id: session.userId,
      walletAddress: session.walletAddress,
      handle: null,
      displayName: null,
      avatarUrl: null,
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="container max-w-4xl mx-auto py-8 space-y-8">
        {/* Post Composer */}
        <section>
          <PostComposer onPostCreated={() => window.location.reload()} />
        </section>

        <Separator />

        {/* Feed */}
        <section>
          <Suspense
            fallback={
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-full max-w-2xl mx-auto">
                    <div className="p-4 space-y-4 border rounded-lg animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-muted rounded-full" />
                        <div className="space-y-1">
                          <div className="h-4 w-24 bg-muted rounded" />
                          <div className="h-3 w-16 bg-muted rounded" />
                        </div>
                      </div>
                      <div className="aspect-video w-full bg-muted rounded-md" />
                      <div className="space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="h-3 w-1/2 bg-muted rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <PostFeed />
          </Suspense>
        </section>
      </main>
    </div>
  )
}
