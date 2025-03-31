"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TeamHeroDashboard from "@/components/team-performance/team-hero-dashboard"
import AgentTable from "@/components/team-performance/agent-table"
import PenaltiesTab from "@/components/team-performance/penalties-tab"
import RewardsTab from "@/components/team-performance/rewards-tab"
import AttendanceTab from "@/components/team-performance/attendance-tab"

export default function TeamPerformancePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const { isViewer } = useAuth()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Team Performance</h2>

      <TeamHeroDashboard />

      <Card className="shadow-sm animate-fade-in">
        <CardHeader className="bg-muted/30 rounded-t-lg">
          <CardTitle>Agent Performance Management</CardTitle>
          <CardDescription>Track and manage agent performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 p-1 bg-muted/20 rounded-none">
              <TabsTrigger
                value="overview"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Agent Overview
              </TabsTrigger>
              <TabsTrigger
                value="penalties"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Penalties
              </TabsTrigger>
              <TabsTrigger
                value="rewards"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Rewards
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Attendance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="p-4 animate-slide-in">
              <AgentTable />
            </TabsContent>

            <TabsContent value="penalties" className="p-4 animate-slide-in">
              <PenaltiesTab />
            </TabsContent>

            <TabsContent value="rewards" className="p-4 animate-slide-in">
              <RewardsTab />
            </TabsContent>

            <TabsContent value="attendance" className="p-4 animate-slide-in">
              <AttendanceTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

