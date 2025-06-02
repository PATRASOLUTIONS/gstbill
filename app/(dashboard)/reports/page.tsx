"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ArrowUpIcon, ArrowDownIcon, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/utils/format-currency"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState("thisMonth")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>({
    metrics: {
      totalSales: Number.NaN,
      salesGrowth: Number.NaN,
      totalPurchases: Number.NaN,
      purchasesGrowth: Number.NaN,
      profit: Number.NaN,
      profitGrowth: Number.NaN,
      orderCount: Number.NaN,
      orderGrowth: Number.NaN,
    },
    monthlyData: Array(12)
      .fill(0)
      .map((_, i) => ({
        name: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
        sales: 0,
        purchases: 0,
      })),
    topProducts: [],
  })

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/reports?dateRange=${dateRange}`)

      if (!response.ok) {
        throw new Error("Failed to fetch reports data")
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error("Error fetching reports data:", err)
      setError("Failed to load reports data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const handleRefresh = () => {
    fetchData()
  }

  const formatGrowth = (value: number) => {
    if (isNaN(value)) return "N/A"
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
  }

  const getGrowthColor = (value: number) => {
    if (isNaN(value)) return "text-gray-500"
    return value >= 0 ? "text-green-500" : "text-red-500"
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="lastWeek">Last Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <Button variant="link" className="absolute top-0 right-0 px-4 py-3" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <CardDescription>
                  {isLoading ? (
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <span className={getGrowthColor(data.metrics.salesGrowth)}>
                      {formatGrowth(data.metrics.salesGrowth)}
                      {data.metrics.salesGrowth >= 0 ? (
                        <ArrowUpIcon className="inline ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="inline ml-1 h-4 w-4" />
                      )}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                  ) : isNaN(data.metrics.totalSales) ? (
                    "NaN"
                  ) : (
                    formatCurrency(data.metrics.totalSales)
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <CardDescription>
                  {isLoading ? (
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <span className={getGrowthColor(data.metrics.purchasesGrowth)}>
                      {formatGrowth(data.metrics.purchasesGrowth)}
                      {data.metrics.purchasesGrowth >= 0 ? (
                        <ArrowUpIcon className="inline ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="inline ml-1 h-4 w-4" />
                      )}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                  ) : isNaN(data.metrics.totalPurchases) ? (
                    "NaN"
                  ) : (
                    formatCurrency(data.metrics.totalPurchases)
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Profit</CardTitle>
                <CardDescription>
                  {isLoading ? (
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <span className={getGrowthColor(data.metrics.profitGrowth)}>
                      {formatGrowth(data.metrics.profitGrowth)}
                      {data.metrics.profitGrowth >= 0 ? (
                        <ArrowUpIcon className="inline ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="inline ml-1 h-4 w-4" />
                      )}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                  ) : isNaN(data.metrics.profit) ? (
                    "NaN"
                  ) : (
                    formatCurrency(data.metrics.profit)
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <CardDescription>
                  {isLoading ? (
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <span className={getGrowthColor(data.metrics.orderGrowth)}>
                      {formatGrowth(data.metrics.orderGrowth)}
                      {data.metrics.orderGrowth >= 0 ? (
                        <ArrowUpIcon className="inline ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="inline ml-1 h-4 w-4" />
                      )}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                  ) : isNaN(data.metrics.orderCount) ? (
                    "NaN"
                  ) : (
                    data.metrics.orderCount
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Sales vs Purchases</CardTitle>
                <CardDescription>Comparison of sales and purchases over the year</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full bg-gray-100 animate-pulse rounded flex items-center justify-center">
                    <p className="text-gray-500">Loading chart data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line type="monotone" dataKey="sales" stroke="#4f46e5" name="Sales" />
                      <Line type="monotone" dataKey="purchases" stroke="#ef4444" name="Purchases" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Products with highest revenue</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full bg-gray-100 animate-pulse rounded flex items-center justify-center">
                    <p className="text-gray-500">Loading chart data...</p>
                  </div>
                ) : data.topProducts.length === 0 ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-gray-500">No sales data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topProducts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="sales" fill="#4f46e5" name="Sales" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Analysis</CardTitle>
              <CardDescription>Detailed breakdown of sales performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Sales analysis content will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Analysis</CardTitle>
              <CardDescription>Stock value and turnover metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Inventory analysis content will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Analysis</CardTitle>
              <CardDescription>Expense tracking and supplier metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Purchase analysis content will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
