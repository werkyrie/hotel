"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import NotificationCenter from "./notification/notification-center"
import { cn } from "@/lib/utils"
import {
  HomeIcon,
  Users2,
  ShoppingCart,
  Wallet2,
  ArrowDownToLine,
  Settings2,
  LogOut,
  User,
  BarChart4,
  ShieldCheck,
  Menu,
  ClipboardList,
  X,
  HotelIcon,
  ChevronRight
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import OfflineDetector from "./offline-detector"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { motion } from "framer-motion"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const router = useRouter()
  const { user, logout, isAdmin, isViewer } = useAuth()

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setCollapsed(true)
      }
    }

    // Initial check
    checkIfMobile()

    // Add event listener
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Make sure the navigateTo function properly handles the dashboard case
  const navigateTo = (tab: string) => {
    if (tab === "dashboard") {
      router.push("/")
      setActiveTab("dashboard")
    } else {
      router.push(`/?tab=${tab}`)
      setActiveTab(tab)
    }

    // Close mobile menu if open
    if (isMobile) {
      setIsSheetOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase()
  }

  // Get avatar based on role
  const getAvatarContent = () => {
    const customAvatar = localStorage.getItem("userAvatar")

    if (customAvatar) {
      return <AvatarImage src={customAvatar} alt="User avatar" />
    }

    if (isAdmin) {
      return (
        <AvatarFallback className="bg-primary text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </AvatarFallback>
      )
    } else if (isViewer) {
      return (
        <AvatarFallback className="bg-gray-700 text-white">
          <User className="h-5 w-5" />
        </AvatarFallback>
      )
    } else {
      return (
        <AvatarFallback className="bg-gray-500 text-white">{user ? getInitials(user.username) : "?"}</AvatarFallback>
      )
    }
  }

  // Mobile sidebar using Sheet component
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 z-40 flex items-center h-16 px-4 bg-background border-b backdrop-blur-sm bg-opacity-90">
          <div className="flex items-center">
            <span className="font-bold text-primary text-xl flex items-center gap-2">
              <HotelIcon className="h-6 w-6" />
              <span>Team Hotel</span>
            </span>
          </div>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className="ml-auto">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 sm:max-w-sm">
              <div className="flex flex-col h-full">
                {/* Header with close button */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="font-bold text-primary text-xl flex items-center gap-2">
                    <HotelIcon className="h-6 w-6" />
                    <span>Team Hotel</span>
                  </div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" aria-label="Close menu">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>

                {/* User info */}
                <div className="flex items-center p-4 border-b bg-muted/50">
                  <Avatar className="h-10 w-10 ring-2 ring-primary ring-offset-2 ring-offset-background">
                    {getAvatarContent()}
                  </Avatar>
                  <div className="ml-3">
                    <p className="font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.role}</p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4">
                  <ul className="space-y-1 px-2">
                    <MobileNavItem
                      icon={<HomeIcon className="h-5 w-5" />}
                      label="Dashboard"
                      active={activeTab === "dashboard"}
                      onClick={() => navigateTo("dashboard")}
                    />
                    <MobileNavItem
                      icon={<Users2 className="h-5 w-5" />}
                      label="Clients"
                      active={activeTab === "clients"}
                      onClick={() => navigateTo("clients")}
                    />
                    <MobileNavItem
                      icon={<ShoppingCart className="h-5 w-5" />}
                      label="Orders"
                      active={activeTab === "orders"}
                      onClick={() => navigateTo("orders")}
                    />
                    <MobileNavItem
                      icon={<ClipboardList className="h-5 w-5" />}
                      label="Order Requests"
                      active={activeTab === "order-requests"}
                      onClick={() => navigateTo("order-requests")}
                      badge={
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                          New
                        </span>
                      }
                    />
                    <MobileNavItem
                      icon={<Wallet2 className="h-5 w-5" />}
                      label="Deposits"
                      active={activeTab === "deposits"}
                      onClick={() => navigateTo("deposits")}
                    />
                    <MobileNavItem
                      icon={<ArrowDownToLine className="h-5 w-5" />}
                      label="Withdrawals"
                      active={activeTab === "withdrawals"}
                      onClick={() => navigateTo("withdrawals")}
                    />
                    <MobileNavItem
                      icon={<BarChart4 className="h-5 w-5" />}
                      label="Team Performance"
                      active={activeTab === "team"}
                      onClick={() => navigateTo("team")}
                    />
                    {!isViewer && (
                      <MobileNavItem
                        icon={<Settings2 className="h-5 w-5" />}
                        label="Settings"
                        active={activeTab === "settings"}
                        onClick={() => navigateTo("settings")}
                      />
                    )}
                  </ul>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t">
                  <Button
                    variant="destructive"
                    className="w-full justify-start hover:scale-105 transition-transform"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Spacer to push content below the fixed header */}
        <div className="h-16"></div>
      </>
    )
  }

  // Desktop sidebar - always expanded
  return (
    <div className="h-screen fixed left-0 top-0 z-40 flex flex-col bg-background border-r w-64 shadow-md">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b h-14">
        <div className="flex items-center gap-2">
          <HotelIcon className="h-6 w-6 text-primary" />
          <span className="font-bold text-primary text-xl">Team Hotel</span>
        </div>
      </div>

      {/* User info */}
      <div className="flex items-center p-4 border-b bg-muted/30">
        <Avatar className="h-10 w-10 ring-2 ring-primary ring-offset-2 ring-offset-background">
          {getAvatarContent()}
        </Avatar>
        <div className="ml-3">
          <p className="font-medium">{user?.username}</p>
          <p className="text-xs text-muted-foreground">{user?.role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <TooltipProvider>
          <ul className="space-y-1 px-2">
            <NavItem
              icon={<HomeIcon className="h-5 w-5" />}
              label="Dashboard"
              active={activeTab === "dashboard"}
              collapsed={false}
              onClick={() => navigateTo("dashboard")}
            />
            <NavItem
              icon={<Users2 className="h-5 w-5" />}
              label="Clients"
              active={activeTab === "clients"}
              collapsed={false}
              onClick={() => navigateTo("clients")}
            />
            <NavItem
              icon={<ShoppingCart className="h-5 w-5" />}
              label="Orders"
              active={activeTab === "orders"}
              collapsed={false}
              onClick={() => navigateTo("orders")}
            />
            <NavItem
              icon={<ClipboardList className="h-5 w-5" />}
              label="Order Requests"
              active={activeTab === "order-requests"}
              collapsed={false}
              onClick={() => navigateTo("order-requests")}
              badge={
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                  New
                </span>
              }
            />
            <NavItem
              icon={<Wallet2 className="h-5 w-5" />}
              label="Deposits"
              active={activeTab === "deposits"}
              collapsed={false}
              onClick={() => navigateTo("deposits")}
            />
            <NavItem
              icon={<ArrowDownToLine className="h-5 w-5" />}
              label="Withdrawals"
              active={activeTab === "withdrawals"}
              collapsed={false}
              onClick={() => navigateTo("withdrawals")}
            />
            <NavItem
              icon={<BarChart4 className="h-5 w-5" />}
              label="Team Performance"
              active={activeTab === "team"}
              collapsed={false}
              onClick={() => navigateTo("team")}
            />
            {!isViewer && (
              <NavItem
                icon={<Settings2 className="h-5 w-5" />}
                label="Settings"
                active={activeTab === "settings"}
                collapsed={false}
                onClick={() => navigateTo("settings")}
              />
            )}
          </ul>
        </TooltipProvider>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <OfflineDetector />
            <NotificationCenter />
          </div>
          <ModeToggle />
          <Button 
            variant="ghost" 
            size="default" 
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active: boolean
  collapsed: boolean
  onClick: () => void
  badge?: React.ReactNode
}

function NavItem({ icon, label, active, collapsed, onClick, badge }: NavItemProps) {
  return (
    <li>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all duration-200",
                  active && "bg-primary text-primary-foreground",
                  collapsed && "justify-center p-2",
                )}
                onClick={onClick}
              >
                {icon}
                {!collapsed && (
                  <div className="ml-3 flex items-center justify-between w-full">
                    <span>{label}</span>
                    {badge && !collapsed && badge}
                    {!badge && <ChevronRight className={cn("h-4 w-4 opacity-0", active && "opacity-70")} />}
                  </div>
                )}
                {collapsed && badge && <span className="absolute -top-1 -right-1">{badge}</span>}
              </Button>
            </motion.div>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    </li>
  )
}

interface MobileNavItemProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  badge?: React.ReactNode
}

function MobileNavItem({ icon, label, active, onClick, badge }: MobileNavItemProps) {
  return (
    <li>
      <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant={active ? "default" : "ghost"}
          className={cn(
            "w-full justify-start rounded-lg", 
            active && "bg-primary text-primary-foreground"
          )}
          onClick={onClick}
        >
          {icon}
          <div className="ml-3 flex items-center justify-between w-full">
            <span>{label}</span>
            <div className="flex items-center">
              {badge && badge}
              {!badge && <ChevronRight className={cn("h-4 w-4 opacity-0", active && "opacity-70")} />}
            </div>
          </div>
        </Button>
      </motion.div>
    </li>
  )
}