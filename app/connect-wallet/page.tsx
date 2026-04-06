import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { WalletConnect } from "@/components/wallet-connect"

export default async function ConnectWalletPage() {
  const session = await getSession()

  // Redirect if already logged in
  if (session.isLoggedIn) {
    redirect("/me")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome to Fisidi</h1>
          <p className="text-muted-foreground mt-2">Connect your wallet to get started</p>
        </div>
        <WalletConnect onSuccess={() => (window.location.href = "/me")} />
      </div>
    </div>
  )
}
