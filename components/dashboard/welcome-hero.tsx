"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useClientContext } from "@/context/client-context"
import { useTheme } from "next-themes"

export default function WelcomeHero() {
  const { clients, orders, deposits, withdrawals } = useClientContext()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [greeting, setGreeting] = useState("")
  const { theme } = useTheme()

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Set greeting based on time of day
    const hour = currentTime.getHours()
    if (hour < 12) {
      setGreeting("Good morning")
    } else if (hour < 18) {
      setGreeting("Good afternoon")
    } else {
      setGreeting("Good evening")
    }
  }, [currentTime])

  // Format date as "Monday, January 1, 2023"
  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Format time as "3:45 PM"
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  return (
    <Card
      className={`border-none shadow-sm mb-6 ${theme === "dark" ? "bg-gradient-to-r from-gray-800 to-gray-900" : "bg-gradient-to-r from-blue-50 to-indigo-50"}`}
    >
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl font-bold">{greeting}!</CardTitle>
        <CardDescription className="text-base">
          {formattedDate} • {formattedTime}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Welcome to your Team Hotel Management Dashboard. You are currently managing {clients.length} clients,
          {orders.length} orders, {deposits.length} deposits, and {withdrawals.length} withdrawals.
        </p>
      </CardContent>
    </Card>
  )
}

