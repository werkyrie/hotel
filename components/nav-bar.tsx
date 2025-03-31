"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import { Home, LogOut, Search, Settings, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "./mode-toggle"
import NotificationCenter from "./notification/notification-center"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface NavBarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function NavBar({ activeTab, setActiveTab }: NavBarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ shopId: string; clientName: string }>>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { clients } = useClientContext()
  const { user, logout, isAdmin } = useAuth()

  // Handle clicks outside search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([])
      return
    }

    const term = searchTerm.toLowerCase()
    const results = clients
      .filter((client) => client.shopId.toLowerCase().includes(term) || client.clientName.toLowerCase().includes(term))
      .slice(0, 5) // Limit to 5 results
      .map((client) => ({
        shopId: client.shopId,
        clientName: client.clientName,
      }))

    setSearchResults(results)
  }, [searchTerm, clients])

  const navigateTo = (tab: string) => {
    if (tab === "dashboard") {
      router.push("/")
      setActiveTab("dashboard")
    } else {
      router.push(`/?tab=${tab}`)
      setActiveTab(tab)
    }
  }

  const handleClientClick = (shopId: string) => {
    router.push(`/clients/${shopId}`)
    setShowSearchResults(false)
    setSearchTerm("")
  }

  const handleLogout = () => {
    logout()
  }

  const getInitials = (name: string) => {
    return name?.substring(0, 2).toUpperCase() || "??"
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-background border-b h-16 pl-16 md:pl-64">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left side - Search (smaller on mobile) */}
        <div className="relative w-full max-w-[180px] sm:max-w-xs md:max-w-md" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowSearchResults(true)
              }}
              className="pl-8 w-full text-sm"
              onFocus={() => setShowSearchResults(true)}
            />
          </div>
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
              {searchResults.map((result) => (
                <div
                  key={result.shopId}
                  className="p-2 hover:bg-muted cursor-pointer border-b last:border-0"
                  onClick={() => handleClientClick(result.shopId)}
                >
                  <div className="font-medium text-sm">{result.shopId}</div>
                  <div className="text-xs text-muted-foreground truncate">{result.clientName}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center - Navigation Links (visible only on larger screens) */}
        <div className="hidden lg:flex items-center space-x-2 mx-4">
          <Button
            variant={activeTab === "dashboard" ? "default" : "ghost"}
            size="sm"
            onClick={() => navigateTo("dashboard")}
            className={cn("flex items-center", activeTab === "dashboard" && "bg-primary text-primary-foreground")}
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button
            variant={activeTab === "team" ? "default" : "ghost"}
            size="sm"
            onClick={() => navigateTo("team")}
            className={cn("flex items-center", activeTab === "team" && "bg-primary text-primary-foreground")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Team
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            size="sm"
            onClick={() => navigateTo("settings")}
            className={cn("flex items-center", activeTab === "settings" && "bg-primary text-primary-foreground")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Right side - Controls (compact on mobile) */}
        <div className="flex items-center">
          {/* Notification icon - smaller on mobile */}
          <div className="scale-90 sm:scale-100">
            <NotificationCenter />
          </div>

          {/* Theme toggle - smaller on mobile */}
          <div className="scale-90 sm:scale-100 mx-1 sm:mx-2">
            <ModeToggle />
          </div>

          {/* User dropdown - smaller on mobile */}
          <div className="scale-90 sm:scale-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={localStorage.getItem("userAvatar") || ""} alt="User avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user ? getInitials(user.username) : "??"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.username}</span>
                    <span className="text-xs text-muted-foreground">{user?.role}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigateTo("settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}

