import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin"
import { Navigation } from "@/components/navigation"
import { ModerationDashboard } from "@/components/admin/moderation-dashboard"

export default async function ModerationPage() {
  const adminStatus = await isAdmin()

  if (!adminStatus) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container max-w-6xl mx-auto py-8">
        <ModerationDashboard />
      </main>
    </div>
  )
}
