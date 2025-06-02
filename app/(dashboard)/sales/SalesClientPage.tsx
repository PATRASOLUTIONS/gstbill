"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Filter, FileText, DollarSign, ShoppingCart, Clock, CalendarCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/utils/format-currency"
import { SalesDataTable } from "@/components/sales/sales-data-table"
import { useToast } from "@/components/ui/use-toast"
import { ExportSalesDialog } from "@/components/sales/export-sales-dialog"

export default function SalesClientPage() {
  const { toast } = useToast()
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingPayment: 0,
    pendingOrders: 0,
    todaySales: 0,
    todayOrders: 0,
  })
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSalesStats = async () => {
      try {
        const response = await fetch("/api/sales/totals")
        if (!response.ok) {
          throw new Error("Failed to fetch sales statistics")
        }
        const data = await response.json()
        setSalesStats(data)
      } catch (error) {
        console.error("Error fetching sales statistics:", error)
        toast({
          title: "Error",
          description: "Failed to load sales statistics. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesStats()
  }, [toast])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sales</h1>
        <Link href="/sales/create">
          <Button className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Create Sale Order
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="all" className="rounded-md">
            All Sales
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-md">
            Pending
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-md">
            Completed
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="rounded-md">
            Cancelled
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(salesStats.totalSales)}</h3>
                <p className="text-xs text-muted-foreground mt-1">All time sales value</p>
              </div>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <h3 className="text-2xl font-bold mt-1">{salesStats.totalOrders}</h3>
                <p className="text-xs text-muted-foreground mt-1">All time sales count</p>
              </div>
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payment</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(salesStats.pendingPayment)}</h3>
                <p className="text-xs text-muted-foreground mt-1">{salesStats.pendingOrders} orders pending payment</p>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Today's Sales</p>
                <h3 className="text-2xl font-bold mt-1">{salesStats.todayOrders}</h3>
                <p className="text-xs text-muted-foreground mt-1">{formatCurrency(salesStats.todaySales)}</p>
              </div>
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-sm">
            <Input type="search" placeholder="Search sales..." className="pl-10" />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsExportDialogOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <SalesDataTable activeTab={activeTab} />
      </div>

      <ExportSalesDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen} />
    </div>
  )
}
