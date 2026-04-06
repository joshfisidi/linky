"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Clock, Flame } from "lucide-react"

interface FeedTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="newest" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Newest
        </TabsTrigger>
        <TabsTrigger value="hot" className="flex items-center gap-2">
          <Flame className="h-4 w-4" />
          Hot
        </TabsTrigger>
        <TabsTrigger value="rising" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Rising
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
