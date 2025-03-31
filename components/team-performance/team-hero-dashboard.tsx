"use client"

import type React from "react"

import { useTeamContext } from "@/context/team-context"
import { Card, CardContent } from "@/components/ui/card"
import { Users, CalendarPlus, Calendar, Briefcase, Wallet } from "lucide-react"

export default function TeamHeroDashboard() {
  const { metrics } = useTeamContext()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <MetricCard
        title="Total Agents"
        value={metrics.totalAgents}
        icon={<Users className="h-5 w-5 text-blue-500" />}
        className="team-metrics-card animate-fade-in shadow-sm hover:shadow-md transition-all duration-300"
      />

      <MetricCard
        title="Added Today"
        value={metrics.totalAddedToday}
        icon={<CalendarPlus className="h-5 w-5 text-green-500" />}
        className="team-metrics-card animate-fade-in shadow-sm hover:shadow-md transition-all duration-300"
      />

      <MetricCard
        title="Monthly Added"
        value={metrics.totalMonthlyAdded}
        icon={<Calendar className="h-5 w-5 text-purple-500" />}
        className="team-metrics-card animate-fade-in shadow-sm hover:shadow-md transition-all duration-300"
      />

      <MetricCard
        title="Open Accounts"
        value={metrics.totalOpenAccounts}
        icon={<Briefcase className="h-5 w-5 text-amber-500" />}
        className="team-metrics-card animate-fade-in shadow-sm hover:shadow-md transition-all duration-300"
      />

      <MetricCard
        title="Total Deposits"
        value={`$${metrics.totalDeposits.toLocaleString()}`}
        icon={<Wallet className="h-5 w-5 text-indigo-500" />}
        className="team-metrics-card animate-fade-in shadow-sm hover:shadow-md transition-all duration-300"
      />
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  className?: string
}

function MetricCard({ title, value, icon, className }: MetricCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="p-2 rounded-full bg-background shadow-sm">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

