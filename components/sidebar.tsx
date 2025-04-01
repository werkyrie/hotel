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
  Home,
  Users,
  ShoppingBag,
  Wallet,
  ArrowDownCircle,
  Settings,
  LogOut,
  User,
  BarChart3,
  Shield,
  Menu,
  FileText,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import OfflineDetector from "./offline-detector"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"

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
          <Shield className="h-5 w-5" />
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
        <div className="fixed top-0 left-0 z-40 flex items-center h-16 px-4 bg-background border-b">
          <div className="flex items-center">
            <span className="font-bold text-primary text-xl">CMS</span>
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
                  <div className="font-bold text-primary text-xl">CMS</div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" aria-label="Close menu">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>

                {/* User info */}
                <div className="flex items-center p-4 border-b">
                  <Avatar className="h-10 w-10">{getAvatarContent()}</Avatar>
                  <div className="ml-3">
                    <p className="font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.role}</p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4">
                  <ul className="space-y-1 px-2">
                    <MobileNavItem
                      icon={<Home className="h-5 w-5" />}
                      label="Dashboard"
                      active={activeTab === "dashboard"}
                      onClick={() => navigateTo("dashboard")}
                    />
                    <MobileNavItem
                      icon={<Users className="h-5 w-5" />}
                      label="Clients"
                      active={activeTab === "clients"}
                      onClick={() => navigateTo("clients")}
                    />
                    <MobileNavItem
                      icon={<ShoppingBag className="h-5 w-5" />}
                      label="Orders"
                      active={activeTab === "orders"}
                      onClick={() => navigateTo("orders")}
                    />
                    <MobileNavItem
                      icon={<FileText className="h-5 w-5" />}
                      label="Order Requests"
                      active={activeTab === "order-requests"}
                      onClick={() => navigateTo("order-requests")}
                      badge={<span className="bg-gray-700 text-white text-xs px-1 rounded">New</span>}
                    />
                    <MobileNavItem
                      icon={<Wallet className="h-5 w-5" />}
                      label="Deposits"
                      active={activeTab === "deposits"}
                      onClick={() => navigateTo("deposits")}
                    />
                    <MobileNavItem
                      icon={<ArrowDownCircle className="h-5 w-5" />}
                      label="Withdrawals"
                      active={activeTab === "withdrawals"}
                      onClick={() => navigateTo("withdrawals")}
                    />
                    <MobileNavItem
                      icon={<BarChart3 className="h-5 w-5" />}
                      label="Team Performance"
                      active={activeTab === "team"}
                      onClick={() => navigateTo("team")}
                    />
                    {!isViewer && (
                      <MobileNavItem
                        icon={<Settings className="h-5 w-5" />}
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
                    variant="default"
                    className="w-full justify-start bg-gray-800 hover:bg-gray-700 text-white"
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
    <div className="h-screen fixed left-0 top-0 z-40 flex flex-col bg-background border-r w-64">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b h-14">
        <div className="flex items-center">
          <span className="font-bold text-primary text-xl">Client Management</span>
        </div>
      </div>

      {/* User info */}
      <div className="flex items-center p-4 border-b">
        <Avatar className="h-10 w-10">{getAvatarContent()}</Avatar>
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
              icon={<Home className="h-5 w-5" />}
              label="Dashboard"
              active={activeTab === "dashboard"}
              collapsed={false}
              onClick={() => navigateTo("dashboard")}
            />
            <NavItem
              icon={<Users className="h-5 w-5" />}
              label="Clients"
              active={activeTab === "clients"}
              collapsed={false}
              onClick={() => navigateTo("clients")}
            />
            <NavItem
              icon={<ShoppingBag className="h-5 w-5" />}
              label="Orders"
              active={activeTab === "orders"}
              collapsed={false}
              onClick={() => navigateTo("orders")}
            />
            <NavItem
              icon={<FileText className="h-5 w-5" />}
              label="Order Requests"
              active={activeTab === "order-requests"}
              collapsed={false}
              onClick={() => navigateTo("order-requests")}
              badge={<span className="bg-gray-700 text-white text-xs px-1 rounded">New</span>}
            />
            <NavItem
              icon={<Wallet className="h-5 w-5" />}
              label="Deposits"
              active={activeTab === "deposits"}
              collapsed={false}
              onClick={() => navigateTo("deposits")}
            />
            <NavItem
              icon={<ArrowDownCircle className="h-5 w-5" />}
              label="Withdrawals"
              active={activeTab === "withdrawals"}
              collapsed={false}
              onClick={() => navigateTo("withdrawals")}
            />
            <NavItem
              icon={<BarChart3 className="h-5 w-5" />}
              label="Team Performance"
              active={activeTab === "team"}
              collapsed={false}
              onClick={() => navigateTo("team")}
            />
            {!isViewer && (
              <NavItem
                icon={<Settings className="h-5 w-5" />}
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
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <OfflineDetector />
            <NotificationCenter />
          </div>
          <ModeToggle />
          <Button variant="ghost" size="default" onClick={handleLogout}>
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
            <Button
              variant={active ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-all duration-200",
                active && "bg-gray-800 text-white",
                collapsed && "justify-center p-2",
              )}
              onClick={onClick}
            >
              {icon}
              {!collapsed && (
                <div className="ml-3 flex items-center justify-between w-full">
                  <span>{label}</span>
                  {badge && !collapsed && badge}
                </div>
              )}
              {collapsed && badge && <span className="absolute -top-1 -right-1">{badge}</span>}
            </Button>
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
      <Button
        variant={active ? "default" : "ghost"}
        className={cn("w-full justify-start", active && "bg-gray-800 text-white")}
        onClick={onClick}
      >
        {icon}
        <div className="ml-3 flex items-center justify-between w-full">
          <span>{label}</span>
          {badge && badge}
        </div>
      </Button>
    </li>
  )
}

