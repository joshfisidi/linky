import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Navigation } from "@/components/navigation"
import { UserProfile } from "@/components/user-profile"

export default async function ProfilePage() {
  const session = await requireAuth()

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      likes: {
        include: {
          post: {
            include: {
              author: {
                select: {
                  id: true,
                  handle: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      comments: {
        include: {
          post: {
            include: {
              author: {
                select: {
                  id: true,
                  handle: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })

  if (!user) {
    redirect("/connect-wallet")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <main className="container max-w-4xl mx-auto py-8">
        <UserProfile user={user} isOwnProfile={true} />
      </main>
    </div>
  )
}
