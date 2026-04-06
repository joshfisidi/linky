"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "@/lib/utils"
import { Shield, Eye, Ban, X, AlertTriangle, CheckCircle } from "lucide-react"

interface Report {
  id: string
  createdAt: string
  reason: string
  description?: string
  status: string
  post: {
    id: string
    title?: string
    thumbnailUrl?: string
    provider: string
    author?: {
      id: string
      handle?: string
      displayName?: string
      walletAddress: string
    }
  }
}

export function ModerationDashboard() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("OPEN")
  const [processingReports, setProcessingReports] = useState(new Set<string>())
  const { toast } = useToast()

  const fetchReports = async (status: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/reports?status=${status}&limit=50`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch reports")
      }

      setReports(result.data.reports)
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

  const handleReportAction = async (reportId: string, action: string) => {
    if (processingReports.has(reportId)) return

    setProcessingReports((prev) => new Set(prev).add(reportId))

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to process report")
      }

      toast({
        title: "Success",
        description: result.data.actionTaken,
      })

      // Remove report from current list
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setProcessingReports((prev) => {
        const newSet = new Set(prev)
        newSet.delete(reportId)
        return newSet
      })
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    fetchReports(tab)
  }

  useEffect(() => {
    fetchReports(activeTab)
  }, [])

  const getReasonBadgeVariant = (reason: string) => {
    switch (reason) {
      case "spam":
        return "destructive"
      case "inappropriate":
        return "destructive"
      case "copyright":
        return "secondary"
      case "harassment":
        return "destructive"
      case "violence":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Moderation Dashboard</h1>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="OPEN" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Open Reports
          </TabsTrigger>
          <TabsTrigger value="REVIEWED" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Reviewed
          </TabsTrigger>
          <TabsTrigger value="ACTIONED" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Actioned
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-muted rounded" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted rounded" />
                          <div className="h-3 w-24 bg-muted rounded" />
                        </div>
                      </div>
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="h-4 w-3/4 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No {activeTab.toLowerCase()} reports</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getReasonBadgeVariant(report.reason)}>
                            {report.reason.replace("_", " ")}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <CardTitle className="text-lg">{report.post.title || "Untitled Video"}</CardTitle>
                      </div>
                      {activeTab === "OPEN" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReportAction(report.id, "dismiss")}
                            disabled={processingReports.has(report.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Dismiss
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleReportAction(report.id, "hide_post")}
                            disabled={processingReports.has(report.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Hide Post
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReportAction(report.id, "ban_user")}
                            disabled={processingReports.has(report.id)}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Ban User
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {report.description && (
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm">{report.description}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      {report.post.thumbnailUrl && (
                        <img
                          src={report.post.thumbnailUrl || "/placeholder.svg"}
                          alt="Video thumbnail"
                          className="w-24 h-16 object-cover rounded"
                        />
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {report.post.provider}
                          </Badge>
                          {report.post.author && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {report.post.author.displayName?.[0] || report.post.author.handle?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {report.post.author.displayName || report.post.author.handle || "Anonymous"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {report.post.author.walletAddress.slice(0, 6)}...
                                {report.post.author.walletAddress.slice(-4)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
