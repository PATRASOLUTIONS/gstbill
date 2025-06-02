"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  FileDown,
  MoreHorizontal,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  Package,
  Truck,
  ShoppingCart,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"

// Interface for a stock alert
interface StockAlert {
  id: string
  productId: string
  productName: string
  sku: string
  category: string
  currentStock: number
  maxStock: number
  supplier: string
  status: "Critical" | "Low" | "Reorder Soon" | "OK"
  createdAt: string
}

export default function StockAlertsPage() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof StockAlert
    direction: string
  } | null>({ key: "status", direction: "ascending" })
  const [counts, setCounts] = useState({
    critical: 5,
    low: 10,
    reorderSoon: 20,
    total: 0,
  })
  const [categories, setCategories] = useState<string[]>([])

  // Fetch stock alerts from the API
  useEffect(() => {
    const fetchStockAlerts = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/stock-alerts?search=${searchTerm}&category=${categoryFilter !== "all" ? categoryFilter : ""}&status=${statusFilter !== "all" ? statusFilter : ""}`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch stock alerts")
        }

        const data = await response.json()
        setAlerts(data.alerts)
        setCounts(data.counts)

        // Extract unique categories
        const uniqueCategories = [...new Set(data.alerts.map((alert: StockAlert) => alert.category))]
        setCategories(uniqueCategories)

        setLoading(false)
      } catch (error) {
        console.error("Error fetching stock alerts:", error)
        toast({
          title: "Error",
          description: "Failed to load stock alerts. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchStockAlerts()
  }, [searchTerm, categoryFilter, statusFilter, toast])

  // Sort function
  const requestSort = (key: keyof StockAlert) => {
    let direction = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Apply sorting, filtering and search
  const filteredAndSortedAlerts = () => {
    let filteredAlerts = [...alerts]

    // Apply category filter
    if (categoryFilter !== "all") {
      filteredAlerts = filteredAlerts.filter((alert) => alert.category === categoryFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filteredAlerts = filteredAlerts.filter((alert) => alert.status === statusFilter)
    }

    // Apply search
    if (searchTerm) {
      filteredAlerts = filteredAlerts.filter(
        (alert) =>
          alert.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply sorting
    if (sortConfig !== null) {
      filteredAlerts.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    return filteredAlerts
  }

  // Get current items for pagination
  const sortedAndFilteredAlerts = filteredAndSortedAlerts()
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = sortedAndFilteredAlerts.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(sortedAndFilteredAlerts.length / itemsPerPage)

  // Status badge variant helper
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Critical":
        return "destructive"
      case "Low":
        return "warning"
      case "Reorder Soon":
        return "secondary"
      default:
        return "default"
    }
  }

  // Calculate stock level percentage
  const calculateStockPercentage = (currentStock: number, maxStock: number) => {
    const percentage = (currentStock / maxStock) * 100
    return Math.min(Math.max(percentage, 0), 100)
  }

  // Get progress color based on stock level
  const getProgressColor = (status: string) => {
    switch (status) {
      case "Critical":
        return "bg-destructive"
      case "Low":
        return "bg-amber-500"
      case "Reorder Soon":
        return "bg-blue-500"
      default:
        return "bg-green-500"
    }
  }

  // Helper to render sort indicator
  const renderSortIcon = (key: keyof StockAlert) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  // Handle creating purchase orders
  const handleCreatePurchaseOrder = () => {
    toast({
      title: "Feature Coming Soon",
      description: "The ability to automatically create purchase orders will be available soon.",
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Stock Alerts</h2>
        <div className="flex items-center gap-2">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleCreatePurchaseOrder}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Create Purchase Orders
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.critical}</div>
            <p className="text-xs text-muted-foreground">Items need immediate attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.low}</div>
            <p className="text-xs text-muted-foreground">Items running low</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reorder Soon</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.reorderSoon}</div>
            <p className="text-xs text-muted-foreground">Items to reorder soon</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="low">Low Stock</TabsTrigger>
          <TabsTrigger value="reorder">Reorder Soon</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search products..."
                      className="w-full pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setCategoryFilter("all")}>All Categories</DropdownMenuItem>
                      {categories.map((category) => (
                        <DropdownMenuItem key={category} onClick={() => setCategoryFilter(category)}>
                          {category}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Statuses</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("Critical")}>Critical</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("Low")}>Low Stock</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("Reorder Soon")}>Reorder Soon</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("OK")}>OK</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm">
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex h-[300px] w-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="mt-6 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => requestSort("productName")}>
                          <div className="flex items-center">Product {renderSortIcon("productName")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort("sku")}>
                          <div className="flex items-center">SKU {renderSortIcon("sku")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort("category")}>
                          <div className="flex items-center">Category {renderSortIcon("category")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort("currentStock")}>
                          <div className="flex items-center">Stock Level {renderSortIcon("currentStock")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort("status")}>
                          <div className="flex items-center">Status {renderSortIcon("status")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort("supplier")}>
                          <div className="flex items-center">Supplier {renderSortIcon("supplier")}</div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No products found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentItems.map((alert) => (
                          <TableRow key={alert.id}>
                            <TableCell className="font-medium">{alert.productName}</TableCell>
                            <TableCell>{alert.sku}</TableCell>
                            <TableCell>{alert.category}</TableCell>
                            <TableCell>
                              <div className="flex flex-col space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>{alert.currentStock} / 100</span>
                                  <span>{Math.round(calculateStockPercentage(alert.currentStock, 100))}%</span>
                                </div>
                                <Progress
                                  value={calculateStockPercentage(alert.currentStock, 100)}
                                  className={`h-2 ${getProgressColor(alert.status)}`}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(alert.status) as any}>{alert.status}</Badge>
                            </TableCell>
                            <TableCell>{alert.supplier}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>View product details</DropdownMenuItem>
                                  <DropdownMenuItem>Create purchase order</DropdownMenuItem>
                                  <DropdownMenuItem>Update stock</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>Adjust stock level</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!loading && currentItems.length > 0 && (
                <div className="mt-4 flex items-center justify-end">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNumber = i + 1
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNumber)}
                              isActive={currentPage === pageNumber}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}
                      {totalPages > 5 && (
                        <>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => setCurrentPage(totalPages)}
                              isActive={currentPage === totalPages}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="critical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Critical Stock Items</CardTitle>
              <CardDescription>Items that need immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-[200px] w-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts
                      .filter((alert) => alert.status === "Critical")
                      .slice(0, 5)
                      .map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium">{alert.productName}</TableCell>
                          <TableCell>{alert.sku}</TableCell>
                          <TableCell className="text-destructive font-medium">{alert.currentStock}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={calculateStockPercentage(alert.currentStock, 100)}
                                className="h-2 w-24 bg-destructive/20"
                              />
                              <span className="text-xs">{alert.currentStock}/100</span>
                            </div>
                          </TableCell>
                          <TableCell>{alert.supplier}</TableCell>
                          <TableCell>
                            <Button variant="default" size="sm">
                              Order Now
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {alerts.filter((alert) => alert.status === "Critical").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No critical stock items found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Items that are running low</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-[200px] w-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts
                      .filter((alert) => alert.status === "Low")
                      .slice(0, 5)
                      .map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium">{alert.productName}</TableCell>
                          <TableCell>{alert.sku}</TableCell>
                          <TableCell className="text-amber-500 font-medium">{alert.currentStock}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={calculateStockPercentage(alert.currentStock, 100)}
                                className="h-2 w-24 bg-amber-500/20"
                              />
                              <span className="text-xs">{alert.currentStock}/100</span>
                            </div>
                          </TableCell>
                          <TableCell>{alert.supplier}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Order Now
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {alerts.filter((alert) => alert.status === "Low").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No low stock items found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reorder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reorder Soon Items</CardTitle>
              <CardDescription>Items that need to be reordered soon</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-[200px] w-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts
                      .filter((alert) => alert.status === "Reorder Soon")
                      .slice(0, 5)
                      .map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium">{alert.productName}</TableCell>
                          <TableCell>{alert.sku}</TableCell>
                          <TableCell className="text-blue-500 font-medium">{alert.currentStock}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={calculateStockPercentage(alert.currentStock, 100)}
                                className="h-2 w-24 bg-blue-500/20"
                              />
                              <span className="text-xs">{alert.currentStock}/100</span>
                            </div>
                          </TableCell>
                          <TableCell>{alert.supplier}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Add to Order
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {alerts.filter((alert) => alert.status === "Reorder Soon").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No items to reorder soon found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
