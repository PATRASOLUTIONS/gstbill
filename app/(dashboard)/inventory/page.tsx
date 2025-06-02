"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Search,
  Plus,
  Filter,
  FileDown,
  FileUp,
  MoreHorizontal,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Package,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Calendar,
  ShoppingCart,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"

// Interface for an inventory item
interface InventoryItem {
  _id: string
  name: string
  category: string
  sku: string
  batchNumber: string
  location: string
  quantity: number
  unitPrice: number
  totalValue: number
  reorderLevel: number
  status: "In Stock" | "Low Stock" | "Out of Stock"
  lastUpdated: string
  expiryDate: string | null
  createdBy: string
}

// Interface for inventory stats
interface InventoryStats {
  totalProducts: number
  totalValue: number
  lowStockItems: number
  reorderNeeded: number
  monthlyGrowth: {
    products: number
    value: number
  }
  weeklyChange: {
    lowStock: number
    reorderNeeded: number
  }
}

// Inventory stats summary component
const InventoryStatsSummary = ({ stats, loading }: { stats: InventoryStats | null; loading: boolean }) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Data Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Please refresh or check connection</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            {stats.monthlyGrowth.products >= 0 ? "+" : ""}
            {stats.monthlyGrowth.products} from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.totalValue.toLocaleString("en-IN")}</div>
          <p className="text-xs text-muted-foreground">
            {stats.monthlyGrowth.value >= 0 ? "+" : ""}
            {stats.monthlyGrowth.value.toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.lowStockItems}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {stats.weeklyChange.lowStock > 0 ? (
              <ArrowUp className="mr-1 h-4 w-4 text-red-500" />
            ) : (
              <ArrowDown className="mr-1 h-4 w-4 text-green-500" />
            )}
            <span>
              {stats.weeklyChange.lowStock > 0 ? "+" : ""}
              {stats.weeklyChange.lowStock} from last week
            </span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reorder Needed</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.reorderNeeded}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {stats.weeklyChange.reorderNeeded > 0 ? (
              <ArrowUp className="mr-1 h-4 w-4 text-red-500" />
            ) : (
              <ArrowDown className="mr-1 h-4 w-4 text-green-500" />
            )}
            <span>
              {stats.weeklyChange.reorderNeeded > 0 ? "+" : ""}
              {stats.weeklyChange.reorderNeeded} from last week
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Recent inventory changes component
const RecentInventoryChanges = ({ loading }: { loading: boolean }) => {
  const [changes, setChanges] = useState<any[]>([])

  useEffect(() => {
    const fetchRecentChanges = async () => {
      try {
        const response = await fetch("/api/inventory/changes")
        if (response.ok) {
          const data = await response.json()
          setChanges(data.changes || [])
        }
      } catch (error) {
        console.error("Error fetching recent inventory changes:", error)
      }
    }

    fetchRecentChanges()
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Change Type</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>User</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {changes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              No recent changes found.
            </TableCell>
          </TableRow>
        ) : (
          changes.map((change) => (
            <TableRow key={change._id}>
              <TableCell className="font-medium">{change.productName}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    change.changeType === "Stock In"
                      ? "bg-green-100"
                      : change.changeType === "Stock Out"
                        ? "bg-amber-100"
                        : "bg-blue-100"
                  }
                >
                  {change.changeType}
                </Badge>
              </TableCell>
              <TableCell>
                {change.changeType === "Stock In" ? "+" : "-"}
                {change.quantity}
              </TableCell>
              <TableCell>{new Date(change.timestamp).toLocaleString()}</TableCell>
              <TableCell>{change.userName}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export default function InventoryPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryItem
    direction: "ascending" | "descending"
  } | null>(null)

  // Form state for adding new item
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    sku: "",
    batchNumber: "",
    location: "",
    quantity: 0,
    unitPrice: 0,
    reorderLevel: 0,
    expiryDate: "",
  })

  // Fetch inventory data
  useEffect(() => {
    const fetchInventoryData = async () => {
      setLoading(true)
      try {
        // Fetch inventory items from products table
        const itemsResponse = await fetch("/api/inventory")
        if (!itemsResponse.ok) throw new Error("Failed to fetch inventory items")
        const itemsData = await itemsResponse.json()

        // Process items to add status
        const processedItems = itemsData.items.map((item: any) => ({
          ...item,
          totalValue: item.quantity * item.unitPrice,
          status: getItemStatus(item.quantity, item.reorderLevel),
        }))

        setItems(processedItems)

        // Extract unique categories
        const uniqueCategories = [...new Set(processedItems.map((item: any) => item.category))]
        setCategories(uniqueCategories)

        // Fetch inventory stats
        const statsResponse = await fetch("/api/inventory/stats")
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }
      } catch (error) {
        console.error("Error fetching inventory data:", error)
        toast({
          title: "Error",
          description: "Failed to load inventory data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInventoryData()
  }, [toast])

  // Helper function to determine item status
  const getItemStatus = (quantity: number, reorderLevel: number): "In Stock" | "Low Stock" | "Out of Stock" => {
    if (quantity === 0) return "Out of Stock"
    if (quantity <= reorderLevel) return "Low Stock"
    return "In Stock"
  }

  // Sort function
  const requestSort = (key: keyof InventoryItem) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Apply sorting, filtering and search
  const filteredAndSortedItems = () => {
    let filteredItems = [...items]

    // Apply category filter
    if (categoryFilter !== "all") {
      filteredItems = filteredItems.filter((item) => item.category === categoryFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filteredItems = filteredItems.filter((item) => item.status === statusFilter)
    }

    // Apply search
    if (searchTerm) {
      filteredItems = filteredItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply sorting
    if (sortConfig !== null) {
      filteredItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    return filteredItems
  }

  // Get current items for pagination
  const sortedAndFilteredItems = filteredAndSortedItems()
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = sortedAndFilteredItems.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(sortedAndFilteredItems.length / itemsPerPage)

  // Status badge variant helper
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "In Stock":
        return "success"
      case "Low Stock":
        return "warning"
      case "Out of Stock":
        return "destructive"
      default:
        return "default"
    }
  }

  // Helper to render sort indicator
  const renderSortIcon = (key: keyof InventoryItem) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setNewItem((prev) => ({ ...prev, [id]: value }))
  }

  // Handle adding a new item
  const handleAddItem = async () => {
    try {
      // Basic validation
      if (!newItem.name || !newItem.category || !newItem.sku) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newItem,
          quantity: Number(newItem.quantity),
          unitPrice: Number(newItem.unitPrice),
          reorderLevel: Number(newItem.reorderLevel),
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Add the new item to the state with calculated fields
        const addedItem = {
          ...data.item,
          totalValue: data.item.quantity * data.item.unitPrice,
          status: getItemStatus(data.item.quantity, data.item.reorderLevel),
        }

        setItems((prev) => [...prev, addedItem])

        // Update stats
        if (stats) {
          setStats({
            ...stats,
            totalProducts: stats.totalProducts + 1,
            totalValue: stats.totalValue + addedItem.totalValue,
          })
        }

        // Reset form and close dialog
        setNewItem({
          name: "",
          category: "",
          sku: "",
          batchNumber: "",
          location: "",
          quantity: 0,
          unitPrice: 0,
          reorderLevel: 0,
          expiryDate: "",
        })

        setIsAddItemOpen(false)

        toast({
          title: "Success",
          description: "Inventory item added successfully.",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to add inventory item")
      }
    } catch (error: any) {
      console.error("Error adding inventory item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add inventory item. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle exporting inventory data
  const handleExportInventory = async () => {
    try {
      const response = await fetch("/api/inventory/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `inventory_export_${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Export Successful",
          description: "Inventory data has been exported to CSV.",
        })
      } else {
        throw new Error("Failed to export inventory data")
      }
    } catch (error) {
      console.error("Error exporting inventory:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export inventory data. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Render loading state
  if (loading && items.length === 0) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md ml-2" />
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <Skeleton className="h-5 w-5" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-48 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
        <div className="flex items-center gap-2">
          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>Fill in the details to add a new item to your inventory.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name*</Label>
                  <Input id="name" placeholder="Enter product name" value={newItem.name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU*</Label>
                  <Input id="sku" placeholder="Enter SKU" value={newItem.sku} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category*</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">+ Add New Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    placeholder="Enter batch number"
                    value={newItem.batchNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity*</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={newItem.quantity}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price (₹)*</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    placeholder="Enter unit price"
                    value={newItem.unitPrice}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderLevel">Reorder Level*</Label>
                  <Input
                    id="reorderLevel"
                    type="number"
                    placeholder="Enter reorder level"
                    value={newItem.reorderLevel}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Storage Location</Label>
                  <Input
                    id="location"
                    placeholder="Enter storage location"
                    value={newItem.location}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <Input id="expiryDate" type="date" value={newItem.expiryDate} onChange={handleInputChange} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manage">Manage Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <InventoryStatsSummary stats={stats} loading={loading} />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Current inventory levels by status</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-100">
                            In Stock
                          </Badge>
                          <span className="text-sm font-medium">
                            {items.filter((i) => i.status === "In Stock").length} items
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {items.length > 0
                            ? Math.round((items.filter((i) => i.status === "In Stock").length / items.length) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          items.length > 0
                            ? (items.filter((i) => i.status === "In Stock").length / items.length) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-yellow-100">
                            Low Stock
                          </Badge>
                          <span className="text-sm font-medium">
                            {items.filter((i) => i.status === "Low Stock").length} items
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {items.length > 0
                            ? Math.round((items.filter((i) => i.status === "Low Stock").length / items.length) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          items.length > 0
                            ? (items.filter((i) => i.status === "Low Stock").length / items.length) * 100
                            : 0
                        }
                        className="h-2 bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-red-100">
                            Out of Stock
                          </Badge>
                          <span className="text-sm font-medium">
                            {items.filter((i) => i.status === "Out of Stock").length} items
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {items.length > 0
                            ? Math.round((items.filter((i) => i.status === "Out of Stock").length / items.length) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          items.length > 0
                            ? (items.filter((i) => i.status === "Out of Stock").length / items.length) * 100
                            : 0
                        }
                        className="h-2 bg-muted"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions Needed</CardTitle>
                <CardDescription>Items that require your attention</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <Skeleton className="mt-0.5 h-5 w-5" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-48 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
                      <div>
                        <h4 className="text-sm font-medium">Low Stock Items</h4>
                        <p className="text-sm text-muted-foreground">
                          {items.filter((i) => i.status === "Low Stock").length} items below reorder level
                        </p>
                        <Button variant="link" className="h-auto p-0 text-amber-600">
                          View Items
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Calendar className="mt-0.5 h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="text-sm font-medium">Expiring Soon</h4>
                        <p className="text-sm text-muted-foreground">
                          {
                            items.filter(
                              (i) =>
                                i.expiryDate &&
                                new Date(i.expiryDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000,
                            ).length
                          }{" "}
                          items expiring in 30 days
                        </p>
                        <Button variant="link" className="h-auto p-0 text-blue-600">
                          View Items
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <RefreshCw className="mt-0.5 h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="text-sm font-medium">Inventory Audit</h4>
                        <p className="text-sm text-muted-foreground">Last audit was 45 days ago</p>
                        <Button variant="link" className="h-auto p-0 text-green-600">
                          Schedule Audit
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Inventory Changes</CardTitle>
              <CardDescription>List of the latest updates to your inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentInventoryChanges loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search inventory..."
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
                      <DropdownMenuItem onClick={() => setStatusFilter("In Stock")}>In Stock</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("Low Stock")}>Low Stock</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("Out of Stock")}>Out of Stock</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" onClick={handleExportInventory}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileUp className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                </div>
              </div>

              <div className="mt-6 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("name")}>
                        <div className="flex items-center">Product {renderSortIcon("name")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("category")}>
                        <div className="flex items-center">Category {renderSortIcon("category")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("sku")}>
                        <div className="flex items-center">SKU {renderSortIcon("sku")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("quantity")}>
                        <div className="flex items-center">Quantity {renderSortIcon("quantity")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("unitPrice")}>
                        <div className="flex items-center">Unit Price {renderSortIcon("unitPrice")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("status")}>
                        <div className="flex items-center">Status {renderSortIcon("status")}</div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [...Array(itemsPerPage)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-5 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : currentItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No inventory items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentItems.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className={item.quantity < item.reorderLevel ? "text-amber-500" : ""}>
                                {item.quantity}
                              </span>
                              {item.quantity === 0 && (
                                <Badge variant="destructive" className="ml-2">
                                  Out of Stock
                                </Badge>
                              )}
                              {item.quantity > 0 && item.quantity <= item.reorderLevel && (
                                <Badge
                                  variant="warning"
                                  className="ml-2 bg-amber-100 text-amber-700 hover:bg-amber-100"
                                >
                                  Low Stock
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(item.status) as any}
                              className={
                                item.status === "Low Stock" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : ""
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
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
                                <DropdownMenuItem>View details</DropdownMenuItem>
                                <DropdownMenuItem>Edit item</DropdownMenuItem>
                                <DropdownMenuItem>Add stock</DropdownMenuItem>
                                <DropdownMenuItem>Remove stock</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">Delete item</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
