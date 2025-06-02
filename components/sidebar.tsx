"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Box,
  ClipboardList,
  CreditCard,
  Home,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  AlertTriangle,
  FileText,
  RefreshCw,
  UserCircle,
  Shield,
  RefreshCcw,
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"
import { useToast } from "@/components/ui/use-toast"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

// Define all possible routes with exact permission keys matching the dialog
const allRoutes = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    active: false,
  },
  {
    id: "products",
    label: "Products",
    icon: Package,
    href: "/products",
    active: false,
  },
  {
    id: "categories",
    label: "Categories",
    icon: Package,
    href: "/categories",
    active: false,
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    href: "/customers",
    active: false,
  },
  {
    id: "sales",
    label: "Sales",
    icon: CreditCard,
    href: "/sales",
    active: false,
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: ShoppingCart,
    href: "/purchases",
    active: false,
  },
  {
    id: "suppliers",
    label: "Suppliers",
    icon: Truck,
    href: "/suppliers",
    active: false,
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: FileText,
    href: "/invoices",
    active: false,
  },
  {
    id: "refunds",
    label: "Refunds",
    icon: RefreshCw,
    href: "/refunds",
    active: false,
  },
  {
    id: "stock-alerts",
    label: "Stock Alerts",
    icon: AlertTriangle,
    href: "/stock-alerts",
    active: false,
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    href: "/reports",
    active: false,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Box,
    href: "/inventory",
    active: false,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
    active: false,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isMobile = useMobile()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const onNavigate = (href: string) => {
    if (isMobile) {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (session) {
      setLoading(false)
    }
  }, [session])

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed left-4 top-4 z-40 lg:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SidebarContent onNavigate={onNavigate} loading={loading} />
        </SheetContent>
      </Sheet>
    )
  }

  return <SidebarContent className={className} onNavigate={onNavigate} loading={loading} />
}

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onNavigate: (href: string) => void
  loading: boolean
}

function SidebarContent({ className, onNavigate, loading: initialLoading }: SidebarContentProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { toast } = useToast()
  const [loading, setLoading] = useState(initialLoading)
  const [refreshing, setRefreshing] = useState(false)
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({})
  const isAdmin = session?.user?.role === "admin"

  // Fetch the latest permissions directly from the API
  const fetchLatestPermissions = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/users/me/sidebar-permissions`)

      if (!response.ok) {
        throw new Error("Failed to fetch permissions")
      }

      const data = await response.json()
      setUserPermissions(data.sidebarPermissions || {})
    } catch (error) {
      console.error("Error fetching permissions:", error)
      // Fallback to session permissions if API fails
      setUserPermissions(session?.user?.sidebarPermissions || {})
    } finally {
      setLoading(false)
    }
  }

  // Refresh permissions
  const handleRefreshPermissions = async () => {
    setRefreshing(true)
    try {
      await fetchLatestPermissions()
      toast({
        title: "Permissions refreshed",
        description: "Your sidebar permissions have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh permissions",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLatestPermissions()
  }, [session])

  // Filter routes based on user permissions
  const visibleRoutes = allRoutes
    .filter((route) => {
      // Admin can see all routes
      if (isAdmin) return true

      // For regular users, check permissions using the route id
      return userPermissions[route.id] === true
    })
    .map((route) => ({
      ...route,
      active: pathname === route.href,
    }))

  // Add admin route if user is admin
  if (isAdmin) {
    visibleRoutes.push({
      id: "admin",
      label: "Admin",
      icon: Shield,
      href: "/admin",
      active: pathname === "/admin",
    })
  }

  return (
    <div className={cn("flex h-full w-60 flex-col border-r bg-background", className)}>
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
          onClick={() => onNavigate("/dashboard")}
        >
          <ClipboardList className="h-6 w-6" />
          <span>QuickBill GST</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2 py-2">
          {loading
            ? // Show skeleton loaders while loading
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
                    <div className="h-4 w-4 animate-pulse rounded-full bg-muted"></div>
                    <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                  </div>
                ))
            : visibleRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => onNavigate(route.href)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                    route.active ? "bg-muted text-primary" : "text-muted-foreground",
                  )}
                >
                  <route.icon className="h-4 w-4" />
                  {route.label}
                </Link>
              ))}
        </div>
      </ScrollArea>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-full">
              <UserCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email || ""}</p>
            </div>
          </div>
        </div>
        <Separator className="my-2" />
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-muted-foreground mb-2"
          onClick={handleRefreshPermissions}
          disabled={refreshing}
        >
          <RefreshCcw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing..." : "Refresh Permissions"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  )
}

function Menu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}

