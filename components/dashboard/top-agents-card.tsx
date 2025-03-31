"use client"

import { useClientContext } from "@/context/client-context"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Trophy } from "lucide-react"
import { useTheme } from "next-themes"

interface AgentStat {
  agent: string
  value: number
  percentage: number
}

export default function TopAgentsCard() {
  const { clients, deposits } = useClientContext()
  const [topDepositAgents, setTopDepositAgents] = useState<AgentStat[]>([])
  const [topClientAgents, setTopClientAgents] = useState<AgentStat[]>([])
  const { theme } = useTheme()
  const isDark = theme === "dark"

  useEffect(() => {
    if (clients.length === 0) return

    // Calculate top agents by deposits
    const agentDeposits: Record<string, number> = {}

    deposits.forEach((deposit) => {
      if (!agentDeposits[deposit.agent]) {
        agentDeposits[deposit.agent] = 0
      }
      agentDeposits[deposit.agent] += deposit.amount
    })

    const sortedDepositAgents = Object.entries(agentDeposits)
      .map(([agent, value]) => ({ agent, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const maxDeposit = sortedDepositAgents.length > 0 ? sortedDepositAgents[0].value : 0

    setTopDepositAgents(
      sortedDepositAgents.map((item) => ({
        agent: item.agent,
        value: item.value,
        percentage: maxDeposit > 0 ? (item.value / maxDeposit) * 100 : 0,
      })),
    )

    // Calculate top agents by number of clients
    const agentClients: Record<string, number> = {}

    clients.forEach((client) => {
      if (!agentClients[client.agent]) {
        agentClients[client.agent] = 0
      }
      agentClients[client.agent]++
    })

    const sortedClientAgents = Object.entries(agentClients)
      .map(([agent, value]) => ({ agent, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const maxClients = sortedClientAgents.length > 0 ? sortedClientAgents[0].value : 0

    setTopClientAgents(
      sortedClientAgents.map((item) => ({
        agent: item.agent,
        value: item.value,
        percentage: maxClients > 0 ? (item.value / maxClients) * 100 : 0,
      })),
    )
  }, [clients, deposits])

  // Generate a consistent color based on agent name
  const getAgentColor = (agent: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-cyan-500",
    ]

    // Simple hash function to get a consistent index
    const hash = agent.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <Card className="dashboard-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
          Top Performing Agents
        </CardTitle>
        <CardDescription>Agent performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deposits" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="deposits">Highest Deposits</TabsTrigger>
            <TabsTrigger value="clients">Most Clients</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits" className="space-y-4 animate-slide-in">
            {topDepositAgents.length > 0 ? (
              topDepositAgents.map((agent, index) => (
                <div key={agent.agent} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarFallback className={getAgentColor(agent.agent)}>
                            {agent.agent.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background">
                            <span
                              className={`text-[10px] font-bold ${
                                index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-700"
                              }`}
                            >
                              {index + 1}
                            </span>
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{agent.agent}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">${agent.value.toFixed(2)}</p>
                  </div>
                  <Progress value={agent.percentage} className="h-2 progress-bar-animate" />
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No deposit data available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="clients" className="space-y-4 animate-slide-in">
            {topClientAgents.length > 0 ? (
              topClientAgents.map((agent, index) => (
                <div key={agent.agent} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarFallback className={getAgentColor(agent.agent)}>
                            {agent.agent.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background">
                            <span
                              className={`text-[10px] font-bold ${
                                index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-700"
                              }`}
                            >
                              {index + 1}
                            </span>
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{agent.agent}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{agent.value} clients</p>
                  </div>
                  <Progress value={agent.percentage} className="h-2 progress-bar-animate" />
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No client data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

