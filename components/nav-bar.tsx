"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import { 
  HomeIcon, 
  LogOut, 
  Search, 
  Settings, 
  BarChart4, 
  UserCircle2,
  Bell,
  ChevronDown,
  Command,
  Rocket,
  HelpCircle,
  Contact,
  BookMarked
} from "lucide-react"
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
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavBarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function NavBar({ activeTab, setActiveTab }: NavBarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ shopId: string; clientName: string }>>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showSearchHint, setShowSearchHint] = useState(false)
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

  // Add keyboard shortcut for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.getElementById('global-search')
        if (searchInput) {
          searchInput.focus()
          setShowSearchHint(false)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
    <div className="fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-md border-b h-16 pl-16 md:pl-64 transition-all duration-200 shadow-sm">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left side - Search (smaller on mobile) */}
        <div className="relative w-full max-w-[220px] sm:max-w-xs md:max-w-md" ref={searchRef}>
          <div className="relative group">
            <div className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors">
              <Search className="h-4 w-4" />
            </div>
            <Input
              id="global-search"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowSearchResults(true)
              }}
              className="pl-8 w-full text-sm border-muted ring-offset-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200"
              onFocus={() => {
                setShowSearchResults(true)
                setShowSearchHint(true)
              }}
              onBlur={() => {
                setTimeout(() => setShowSearchHint(false), 200)
              }}
            />
            <div className="absolute right-2 top-2 text-xs text-muted-foreground hidden md:flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px]">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px]">K</kbd>
            </div>
          </div>
          
          <AnimatePresence>
            {showSearchResults && searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 w-full mt-1 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden"
              >
                {searchResults.map((result, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: index * 0.03 }}
                    key={result.shopId}
                    className="p-3 hover:bg-primary/5 cursor-pointer border-b last:border-0 transition-colors"
                    onClick={() => handleClientClick(result.shopId)}
                  >
                    <div className="font-medium text-sm flex items-center">
                      {result.shopId}
                      <Badge variant="outline" className="ml-2 text-xs">Client</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{result.clientName}</div>
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {showSearchHint && searchTerm === "" && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute z-50 w-full mt-1 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 text-sm text-muted-foreground"
              >
                <div className="flex items-center text-xs mb-2">
                  <Command className="h-3 w-3 mr-1" /> 
                  <span>Search for clients by name or ID</span>
                </div>
                <div className="text-xs text-primary">Try searching for a client name or shop ID</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center - Navigation Links (visible only on larger screens) */}
        <div className="hidden lg:flex items-center space-x-2 mx-4">
          <TooltipProvider>
            <NavButton 
              icon={<HomeIcon />} 
              label="Home" 
              active={activeTab === "dashboard"} 
              onClick={() => navigateTo("dashboard")} 
              tooltip="Dashboard"
            />
            <NavButton 
              icon={<BarChart4 />} 
              label="Team" 
              active={activeTab === "team"} 
              onClick={() => navigateTo("team")} 
              tooltip="Team Performance"
            />
            <NavButton 
              icon={<Rocket />} 
              label="Resources" 
              active={activeTab === "resources"} 
              onClick={() => navigateTo("resources")} 
              tooltip="Resources"
            />
            <NavButton 
              icon={<BookMarked />} 
              label="Documentation" 
              active={activeTab === "docs"} 
              onClick={() => navigateTo("docs")} 
              tooltip="Documentation"
            />
            <NavButton 
              icon={<Settings />} 
              label="Settings" 
              active={activeTab === "settings"} 
              onClick={() => navigateTo("settings")} 
              tooltip="Settings"
            />
          </TooltipProvider>
        </div>

        {/* Right side - Controls (compact on mobile) */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Help button - hidden on small screens */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Help & Resources</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Notification icon - smaller on mobile */}
          <div className="scale-90 sm:scale-100">
            <NotificationCenter />
          </div>

          {/* Theme toggle - smaller on mobile */}
          <div className="scale-90 sm:scale-100">
            <ModeToggle />
          </div>

          {/* User dropdown - smaller on mobile */}
          <div className="scale-90 sm:scale-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full px-2 gap-1.5">
                  <Avatar className="h-8 w-8 border-2 border-muted-foreground/10">
                    <AvatarImage src={localStorage.getItem("userAvatar") || ""} alt="User avatar" />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {user ? getInitials(user.username) : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline font-medium text-sm">{user?.username}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" forceMount>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.username}</span>
                    <span className="text-xs text-muted-foreground">{user?.role}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigateTo("profile")}>
                    <UserCircle2 className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigateTo("settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                    <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="https://support.example.com" target="_blank" rel="noopener noreferrer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Support</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://docs.example.com" target="_blank" rel="noopener noreferrer">
                    <BookMarked className="mr-2 h-4 w-4" />
                    <span>Documentation</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="mailto:contact@example.com">
                    <Contact className="mr-2 h-4 w-4" />
                    <span>Contact</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}

interface NavButtonProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  tooltip: string
}

function NavButton({ icon, label, active, onClick, tooltip }: NavButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "default" : "ghost"}
          size="sm"
          onClick={onClick}
          className={cn(
            "flex items-center font-medium gap-1.5 px-3 h-9 transition-all duration-200",
            active && "bg-primary text-primary-foreground",
            !active && "hover:bg-muted"
          )}
        >
          {React.cloneElement(icon as React.ReactElement, { 
            className: "h-4 w-4" 
          })}
          <span className="hidden xl:inline">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  )
}