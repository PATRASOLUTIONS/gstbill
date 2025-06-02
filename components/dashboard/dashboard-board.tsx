"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  LineChart,
  PieChart,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  Truck,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/utils/format-currency"

interface DashboardStats {
  totalProducts: number
  totalSales: number
  totalPurchases: number
  totalCustomers: number
  lowStockItems: number
  revenueThisMonth: number
  revenuePreviousMonth: number
  purchasesThisMonth: number
  purchasesPreviousMonth: number
  topSellingProducts: {
    name: string
    quantity: number
    revenue: number
  }[]
  recentTransactions: {
    id: string
    type: "sale" | "purchase" | "refund"
    amount: number
    customer: string
    date: string
    status: "completed" | "pending" | "cancelled"
  }[]
}

export function DashboardBoard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/dashboard")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          console.error("Failed to fetch dashboard data")
          // Use mock data for demonstration
          setStats({
            totalProducts: 248,
            totalSales: 156,
            totalPurchases: 89,
            totalCustomers: 64,
            lowStockItems: 12,
            revenueThisMonth: 42500,
            revenuePreviousMonth: 38900,
            purchasesThisMonth: 28600,
            purchasesPreviousMonth: 31200,
            topSellingProducts: [
              { name: "Product A", quantity: 42, revenue: 8400 },
              { name: "Product B", quantity: 38, revenue: 7600 },
              { name: "Product C", quantity: 31, revenue: 6200 },
              { name: "Product D", quantity: 28, revenue: 5600 },
              { name: "Product E", quantity: 24, revenue: 4800 },
            ],
            recentTransactions: [
              {
                id: "INV-001",
                type: "sale",
                amount: 1250,
                customer: "ABC Corp",
                date: "2023-06-15",
                status: "completed",
              },
              {
                id: "PO-042",
                type: "purchase",
                amount: 3600,
                customer: "Supplier XYZ",
                date: "2023-06-14",
                status: "completed",
              },
              {
                id: "REF-008",
                type: "refund",
                amount: 450,
                customer: "John Smith",
                date: "2023-06-13",
                status: "completed",
              },
              { id: "INV-002", type: "sale", amount: 875, customer: "Jane Doe", date: "2023-06-12", status: "pending" },
              {
                id: "PO-043",
                type: "purchase",
                amount: 2100,
                customer: "Supplier ABC",
                date: "2023-06-11",
                status: "pending",
              },
            ],
          })
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load dashboard data</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const revenueChange = ((stats.revenueThisMonth - stats.revenuePreviousMonth) / stats.revenuePreviousMonth) * 100
  const purchasesChange =
    ((stats.purchasesThisMonth - stats.purchasesPreviousMonth) / stats.purchasesPreviousMonth) * 100

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lowStockItems > 0 && (
                <span className="flex items-center gap-1 text-amber-500">
                  <AlertTriangle className="h-3 w-3" />
                  {stats.lowStockItems} items low in stock
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              <span className={revenueChange >= 0 ? "text-green-500" : "text-red-500"}>
                {revenueChange >= 0 ? "+" : ""}
                {revenueChange.toFixed(1)}% from last month
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchases}</div>
            <p className="text-xs text-muted-foreground">
              <span className={purchasesChange >= 0 ? "text-green-500" : "text-red-500"}>
                {purchasesChange >= 0 ? "+" : ""}
                {purchasesChange.toFixed(1)}% from last month
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Active accounts in system</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[200px] w-full flex items-center justify-center">
                  <LineChart className="h-16 w-16 text-muted-foreground/50" />
                  <span className="ml-2 text-sm text-muted-foreground">Revenue chart visualization</span>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Top 5 products by sales volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topSellingProducts.map((product, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-[60%]">
                        <div className="text-sm font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.quantity} units · {formatCurrency(product.revenue)}
                        </div>
                      </div>
                      <div className="w-[40%]">
                        <Progress
                          value={(product.quantity / stats.topSellingProducts[0].quantity) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest activity across your inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentTransactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {transaction.type === "sale" && <ShoppingCart className="h-4 w-4 text-green-500" />}
                        {transaction.type === "purchase" && <Truck className="h-4 w-4 text-blue-500" />}
                        {transaction.type === "refund" && <RefreshCw className="h-4 w-4 text-amber-500" />}
                        <div>
                          <div className="text-sm font-medium">{transaction.id}</div>
                          <div className="text-xs text-muted-foreground">{transaction.customer}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(transaction.amount)}</div>
                        <div className="flex items-center justify-end gap-1">
                          <div className="text-xs text-muted-foreground">{transaction.date}</div>
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "outline"
                                : transaction.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Sales Distribution</CardTitle>
                <CardDescription>Product category breakdown</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="h-[200px] w-full flex items-center justify-center">
                  <PieChart className="h-16 w-16 text-muted-foreground/50" />
                  <span className="ml-2 text-sm text-muted-foreground">Sales distribution chart</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>Detailed performance metrics and trends</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <BarChart className="h-16 w-16 text-muted-foreground/50" />
              <span className="ml-2 text-sm text-muted-foreground">Analytics visualization</span>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>Download and export system reports</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex flex-col items-center justify-center gap-4">
              <TrendingUp className="h-16 w-16 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground">Reports would be listed here</span>
              <Button variant="outline">Generate New Report</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

