"use client"

import { useState } from "react"
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { createSiweMessage } from "@/lib/siwe"
import { Wallet, Loader2, CheckCircle } from "lucide-react"

interface WalletConnectProps {
  onSuccess?: () => void
}

export function WalletConnect({ onSuccess }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [showConnectors, setShowConnectors] = useState(false)

  const { address, isConnected, chainId } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { toast } = useToast()

  const handleConnect = async (connector: any) => {
    setIsConnecting(true)
    try {
      await connect({ connector })
      setShowConnectors(false)
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSignIn = async () => {
    if (!address || !chainId) return

    setIsSigning(true)
    try {
      // Get nonce
      const nonceResponse = await fetch("/api/auth/nonce")
      const nonceResult = await nonceResponse.json()

      if (!nonceResponse.ok) {
        throw new Error(nonceResult.message || "Failed to get nonce")
      }

      // Create SIWE message
      const message = createSiweMessage(address, chainId, nonceResult.data.nonce)

      // Sign message
      const signature = await signMessageAsync({ message })

      // Verify signature
      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      })

      const verifyResult = await verifyResponse.json()

      if (!verifyResponse.ok) {
        throw new Error(verifyResult.message || "Failed to verify signature")
      }

      toast({
        title: "Success",
        description: "Wallet connected successfully!",
      })

      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Failed to sign in with wallet",
        variant: "destructive",
      })
    } finally {
      setIsSigning(false)
    }
  }

  if (isConnected && address) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Wallet Connected</CardTitle>
          <CardDescription>
            {address.slice(0, 6)}...{address.slice(-4)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSignIn} disabled={isSigning} className="w-full">
            {isSigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              "Sign In with Wallet"
            )}
          </Button>
          <Button variant="outline" onClick={() => disconnect()} className="w-full">
            Disconnect
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Connect Your Wallet</CardTitle>
          <CardDescription>Connect your BNB wallet to save your posts and interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowConnectors(true)} className="w-full">
            Connect Wallet
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showConnectors} onOpenChange={setShowConnectors}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Wallet</DialogTitle>
            <DialogDescription>Select a wallet to connect to Fisidi</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                variant="outline"
                onClick={() => handleConnect(connector)}
                disabled={isConnecting}
                className="w-full justify-start"
              >
                {isConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
                {connector.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
