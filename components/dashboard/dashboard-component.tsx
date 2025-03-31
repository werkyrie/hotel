"use client"

import WelcomeHero from "@/components/dashboard/welcome-hero"
import StatisticsGrid from "@/components/dashboard/statistics-grid"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClientContext } from "@/context/client-context"
import { useEffect, useState } from "react"
import { differenceInDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import TopAgentsCard from "@/components/dashboard/top-agents-card"

export default function DashboardComponent() {
  const router = useRouter()
  const { clients, orders, deposits } = useClientContext()
  const [inactiveOrderClients, setInactiveOrderClients] = useState<any[]>([])
  const [inactiveDepositClients, setInactiveDepositClients] = useState<any[]>([])

  useEffect(() => {
    if (clients.length === 0 || orders.length === 0 || deposits.length === 0) return

    const today = new Date()
    const activeClients = clients.filter((client) => client.status === "Active")

    // Find clients with order inactivity
    const orderInactiveClients = activeClients
      .map((client) => {
        const clientOrders = orders.filter((order) => order.shopId === client.shopId)

        if (clientOrders.length > 0) {
          // Sort orders by date (newest first)
          clientOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

          const latestOrderDate = new Date(clientOrders[0].date)
          const daysSinceLastOrder = differenceInDays(today, latestOrderDate)

          return {
            ...client,
            daysSinceLastOrder,
            hasInactivity: daysSinceLastOrder >= 2,
          }
        } else {
          return {
            ...client,
            daysSinceLastOrder: null,
            hasInactivity: true,
          }
        }
      })
      .filter((client) => client.hasInactivity)

    // Find clients with deposit inactivity
    const depositInactiveClients = activeClients
      .map((client) => {
        const clientDeposits = deposits.filter((deposit) => deposit.shopId === client.shopId)

        if (clientDeposits.length > 0) {
          // Sort deposits by date (newest first)
          clientDeposits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

          const latestDepositDate = new Date(clientDeposits[0].date)
          const daysSinceLastDeposit = differenceInDays(today, latestDepositDate)

          return {
            ...client,
            daysSinceLastDeposit,
            hasInactivity: daysSinceLastDeposit >= 3,
          }
        } else {
          return {
            ...client,
            daysSinceLastDeposit: null,
            hasInactivity: true,
          }
        }
      })
      .filter((client) => client.hasInactivity)

    setInactiveOrderClients(orderInactiveClients)
    setInactiveDepositClients(depositInactiveClients)
  }, [clients, orders, deposits])

  return (
    <div className="container mx-auto p-4 space-y-6">
      <WelcomeHero />

      <StatisticsGrid />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopAgentsCard />

        <Card>
          <CardHeader>
            <CardTitle>Client Inactivity Alerts</CardTitle>
            <CardDescription>Clients requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="orders">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders">Order Inactivity</TabsTrigger>
                <TabsTrigger value="deposits">Deposit Inactivity</TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="space-y-4 mt-4">
                {inactiveOrderClients.length > 0 ? (
                  <div className="space-y-3">
                    {inactiveOrderClients.slice(0, 5).map((client) => (
                      <div
                        key={client.shopId}
                        className="flex items-center justify-between p-3 border rounded-md bg-yellow-50 dark:bg-yellow-900/20"
                      >
                        <div>
                          <p className="font-medium">{client.clientName}</p>
                          <p className="text-sm text-muted-foreground">{client.shopId}</p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-400">
                            {client.daysSinceLastOrder === null
                              ? "No orders yet"
                              : `${client.daysSinceLastOrder} days since last order`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => router.push(`/?tab=clients&view=${client.shopId}`)}
                        >
                          View <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    {inactiveOrderClients.length > 5 && (
                      <Button variant="outline" className="w-full text-xs" onClick={() => router.push("/?tab=clients")}>
                        View all {inactiveOrderClients.length} clients
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No clients with order inactivity</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="deposits" className="space-y-4 mt-4">
                {inactiveDepositClients.length > 0 ? (
                  <div className="space-y-3">
                    {inactiveDepositClients.slice(0, 5).map((client) => (
                      <div
                        key={client.shopId}
                        className="flex items-center justify-between p-3 border rounded-md bg-orange-50 dark:bg-orange-900/20"
                      >
                        <div>
                          <p className="font-medium">{client.clientName}</p>
                          <p className="text-sm text-muted-foreground">{client.shopId}</p>
                          <p className="text-xs text-orange-700 dark:text-orange-400">
                            {client.daysSinceLastDeposit === null
                              ? "No deposits yet"
                              : `${client.daysSinceLastDeposit} days since last deposit`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => router.push(`/?tab=clients&view=${client.shopId}`)}
                        >
                          View <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    {inactiveDepositClients.length > 5 && (
                      <Button variant="outline" className="w-full text-xs" onClick={() => router.push("/?tab=clients")}>
                        View all {inactiveDepositClients.length} clients
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No clients with deposit inactivity</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

