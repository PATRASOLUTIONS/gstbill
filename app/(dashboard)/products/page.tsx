"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge as BaseBadge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTablePagination } from "@/components/data-table-pagination"
import { formatCurrency } from "@/utils/format-currency"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Download, Filter, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

// Add this custom Badge component right after the imports
const Badge = ({
  variant = "default",
  className,
  ...props
}: React.ComponentProps<typeof BaseBadge> & {
  variant?: "default" | "secondary" | "destructive" | "outline" | "warning"
}) => {
  return (
    <BaseBadge
      className={cn(
        variant === "warning" &&
          "border-yellow-500 bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300",
        className,
      )}
      variant={variant === "warning" ? "outline" : variant}
      {...props}
    />
  )
}

interface Product {
  _id: string
  name: string
  sku: string
  description?: string
  category: string
  price?: number
  cost: number
  quantity: number
  reorderLevel: number
  tax: number
  sellingPrice?: number
  purchasePrice?: number
  taxRate?: number
  hsn?: string
  supplierId?: string
  supplier?: string
  barcode?: string
  location?: string
  createdAt?: string
  updatedAt?: string
  lastModified?: string
  lastModifiedFrom?: string
}

interface Supplier {
  _id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  category?: string
}

interface Category {
  _id: string
  name: string
}

interface PaginationData {
  total: number
  page: number
  limit: number
  pages: number
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page") || "1"))
  const pageSize = 10
  const { toast } = useToast()

  // State variables
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: currentPage,
    limit: pageSize,
    pages: 0,
  })

  // UI state
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [isViewProductOpen, setIsViewProductOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Selected product state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)

  // New product state
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    sku: "",
    category: "",
    quantity: 0,
    cost: 0,
    sellingPrice: 0,
    purchasePrice: 0,
    reorderLevel: 10,
    tax: 0,
    hsn: "",
    description: "",
    location: "Warehouse A",
    supplierId: "",
  })

  // Add these helper functions if they don't exist
  const calculateCostPrice = (purchasePrice, taxRate) => {
    return purchasePrice ? (purchasePrice / (1 + taxRate / 100)).toFixed(2) : ""
  }

  const calculatePurchasePrice = (costPrice, taxRate) => {
    return costPrice ? (costPrice * (1 + taxRate / 100)).toFixed(2) : ""
  }

  // Fetch products from the API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
        })

        if (searchTerm) queryParams.append("search", searchTerm)
        if (categoryFilter && categoryFilter !== "all") queryParams.append("category", categoryFilter)

        const response = await fetch(`/api/products?${queryParams.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }

        const data = await response.json()
        setProducts(data.products || [])
        setPagination(
          data.pagination || {
            total: 0,
            page: currentPage,
            limit: pageSize,
            pages: 0,
          },
        )

        setLoading(false)
      } catch (error) {
        console.error("Error fetching products:", error)
        toast({
          title: "Error",
          description: "Failed to fetch products. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchProducts()
  }, [currentPage, searchTerm, categoryFilter, refreshTrigger, pageSize, toast])

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch("/api/suppliers")
        if (!response.ok) {
          throw new Error("Failed to fetch suppliers")
        }
        const data = await response.json()
        setSuppliers(data.suppliers || [])
      } catch (error) {
        console.error("Error fetching suppliers:", error)
        toast({
          title: "Error",
          description: "Failed to fetch suppliers. Some features may be limited.",
          variant: "destructive",
        })
      }
    }

    fetchSuppliers()
  }, [toast])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        if (!response.ok) {
          throw new Error("Failed to fetch categories")
        }
        const data = await response.json()
        setCategories(data.categories || [])
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])

  // Handle form input changes for new product
  const handleNewProductChange = (field: string, value: string | number) => {
    setNewProduct((prev) => {
      const updatedProduct = { ...prev, [field]: value }

      // Calculate purchase price when cost changes
      if (field === "cost") {
        const taxRate = (prev.tax || 0) / 100 + 1
        updatedProduct.purchasePrice = Number.parseFloat((Number(value) * taxRate).toFixed(2))
      }

      // Calculate cost when purchase price changes
      if (field === "purchasePrice") {
        const taxRate = (prev.tax || 0) / 100 + 1
        updatedProduct.cost = Number.parseFloat((Number(value) / taxRate).toFixed(2))
      }

      // Recalculate purchase price when tax changes
      if (field === "tax" && prev.cost) {
        const taxRate = Number(value) / 100 + 1
        updatedProduct.purchasePrice = Number.parseFloat((prev.cost * taxRate).toFixed(2))
      }

      return updatedProduct
    })
  }

  // Handle form input changes for editing product
  const handleEditProductChange = (field: string, value: string | number) => {
    if (!editingProduct) return

    setEditingProduct((prev) => {
      if (!prev) return prev

      const updatedProduct = { ...prev, [field]: value }

      // Calculate purchase price when cost changes
      if (field === "cost") {
        const taxRate = (prev.tax || 0) / 100 + 1
        updatedProduct.purchasePrice = Number.parseFloat((Number(value) * taxRate).toFixed(2))
      }

      // Calculate cost when purchase price changes
      if (field === "purchasePrice") {
        const taxRate = (prev.tax || 0) / 100 + 1
        updatedProduct.cost = Number.parseFloat((Number(value) / taxRate).toFixed(2))
      }

      // Recalculate purchase price when tax changes
      if (field === "tax" && prev.cost) {
        const taxRate = Number(value) / 100 + 1
        updatedProduct.purchasePrice = Number.parseFloat((prev.cost * taxRate).toFixed(2))
      }

      return updatedProduct
    })
  }

  // Add new product
  const handleAddProduct = async () => {
    try {
      setIsSubmitting(true)

      // Validate required fields
      if (!newProduct.name || !newProduct.sku || !newProduct.category || !newProduct.supplierId) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Ensure tax is explicitly set
      const productData = {
        ...newProduct,
        tax: newProduct.tax !== undefined ? newProduct.tax : 0,
        lastModifiedFrom: "products",
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to add product")
      }

      await response.json()

      toast({
        title: "Success",
        description: "Product added successfully",
      })

      // Reset form and close dialog
      setNewProduct({
        name: "",
        sku: "",
        category: "",
        quantity: 0,
        cost: 0,
        sellingPrice: 0,
        purchasePrice: 0,
        reorderLevel: 10,
        tax: 0,
        hsn: "",
        description: "",
        location: "Warehouse A",
        supplierId: "",
      })
      setIsAddProductOpen(false)

      // Refresh products list
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit existing product
  const handleEditProduct = async () => {
    if (!editingProduct?._id) return

    try {
      setIsSubmitting(true)

      // Show loading toast
      toast({
        title: "Updating product...",
        description: "Please wait while we update the product information.",
      })

      // Ensure tax is explicitly set
      const updateData = {
        name: editingProduct.name,
        sku: editingProduct.sku,
        category: editingProduct.category,
        quantity: editingProduct.quantity,
        cost: editingProduct.cost,
        sellingPrice: editingProduct.sellingPrice,
        purchasePrice: editingProduct.purchasePrice,
        tax: editingProduct.tax !== undefined ? editingProduct.tax : 0,
        supplierId: editingProduct.supplierId,
        description: editingProduct.description,
        reorderLevel: editingProduct.reorderLevel,
        hsn: editingProduct.hsn,
        location: editingProduct.location,
        lastModified: new Date(),
        lastModifiedFrom: "products",
      }

      const response = await fetch(`/api/products?id=${editingProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update product")
      }

      await response.json()

      toast({
        title: "Success",
        description: "Product updated successfully",
      })

      setIsEditProductOpen(false)
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/products?id=${productToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete product")
      }

      toast({
        title: "Success",
        description: "Product deleted successfully",
      })

      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // View product details
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)

    // Find the supplier for this product
    if (product.supplierId) {
      const supplier = suppliers.find((s) => s._id === product.supplierId)
      setSelectedSupplier(supplier || null)
    } else {
      setSelectedSupplier(null)
    }

    setIsViewProductOpen(true)
  }

  // Open edit dialog
  const handleEditClick = (product: Product) => {
    setEditingProduct(product)
    setIsEditProductOpen(true)
  }

  // Open delete confirmation dialog
  const handleDeleteClick = (id: string) => {
    setProductToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  // Refresh product list
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // The search will be triggered by the useEffect
  }

  // Handle pagination change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    const url = new URL(window.location.href)
    url.searchParams.set("page", page.toString())
    router.push(url.pathname + url.search)

    // Force a refresh of the data with the new page
    const fetchWithNewPage = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
        })

        if (searchTerm) queryParams.append("search", searchTerm)
        if (categoryFilter && categoryFilter !== "all") queryParams.append("category", categoryFilter)

        const response = await fetch(`/api/products?${queryParams.toString()}`)
        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }

        const data = await response.json()
        setProducts(data.products || [])
        setPagination(
          data.pagination || {
            total: 0,
            page: page,
            limit: pageSize,
            pages: 0,
          },
        )
      } catch (error) {
        console.error("Error fetching products:", error)
      }
    }

    fetchWithNewPage()
  }

  // Export products to CSV
  const handleExportCSV = async () => {
    try {
      // Show loading toast
      toast({
        title: "Preparing Export",
        description: "Your products are being prepared for export.",
      })

      // Fetch all products for export (without pagination)
      const response = await fetch(`/api/products?limit=1000`)

      if (!response.ok) {
        throw new Error("Failed to fetch products for export")
      }

      const data = await response.json()
      const productsToExport = data.products || []

      if (productsToExport.length === 0) {
        toast({
          title: "No Data",
          description: "There are no products to export.",
          variant: "destructive",
        })
        return
      }

      // Prepare CSV content
      const headers = [
        "Name",
        "SKU",
        "Category",
        "Selling Price",
        "Purchase Price",
        "Tax (%)",
        "Cost",
        "Quantity",
        "Reorder Level",
        "Location",
        "Description",
      ]

      const csvRows = [
        headers.join(","), // Header row
        ...productsToExport.map((product) =>
          [
            `"${product.name.replace(/"/g, '""')}"`,
            `"${product.sku.replace(/"/g, '""')}"`,
            `"${product.category.replace(/"/g, '""')}"`,
            product.sellingPrice || 0,
            product.purchasePrice || (product.cost * 1.18).toFixed(2),
            product.tax,
            product.cost,
            product.quantity,
            product.reorderLevel,
            `"${(product.location || "").replace(/"/g, '""')}"`,
            `"${(product.description || "").replace(/"/g, '""')}"`,
          ].join(","),
        ),
      ]

      const csvContent = csvRows.join("\n")

      // Create a blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `products-export-${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Complete",
        description: "Your products have been exported successfully.",
      })
    } catch (error) {
      console.error("Error exporting products:", error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export products",
        variant: "destructive",
      })
    }
  }

  // Render loading skeleton
  if (loading && products.length === 0) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-10 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>

            <div className="mt-6 rounded-md border">
              <div className="p-4 space-y-4">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your inventory products, track stock levels, and update product information.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAddProductOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="order-now">Order Now</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search products..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button type="submit">Search</Button>
                </form>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuItem onClick={() => setCategoryFilter("all")}>All Categories</DropdownMenuItem>
                      {categories.map((category) => (
                        <DropdownMenuItem key={category._id} onClick={() => setCategoryFilter(category.name)}>
                          {category.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mt-6 rounded-md border shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">SKU</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-right p-2">Selling Price</th>
                        <th className="text-right p-2">Purchase Price</th>
                        <th className="text-right p-2">Cost</th>
                        <th className="text-right p-2">Quantity</th>
                        <th className="text-center p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center p-4">
                            No products found
                          </td>
                        </tr>
                      ) : (
                        products.map((product) => {
                          const updatedBySupplier = product.lastModifiedFrom === "suppliers"
                          const updatedByPurchases = product.lastModifiedFrom === "purchases"
                          const updatedBySales = product.lastModifiedFrom === "sales"

                          // Calculate purchase price if not already set
                          const purchasePrice = product.purchasePrice || product.cost * (1 + (product.tax || 0) / 100)

                          return (
                            <tr
                              key={product._id}
                              className={cn(
                                "border-b hover:bg-muted/50",
                                updatedBySupplier && "bg-muted/30",
                                updatedByPurchases && "bg-muted/30",
                              )}
                            >
                              <td className="p-2">{product.name}</td>
                              <td className="p-2">{product.sku}</td>
                              <td className="p-2">
                                <Badge variant="outline">{product.category}</Badge>
                              </td>
                              <td className="p-2 text-right">{formatCurrency(product.sellingPrice || 0)}</td>
                              <td className="p-2 text-right">
                                <div
                                  className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                                  onClick={() => {
                                    // Create a copy of the product with updated purchase price
                                    const updatedProduct = {
                                      ...product,
                                      purchasePrice,
                                    }
                                    setEditingProduct(updatedProduct)
                                    setIsEditProductOpen(true)
                                  }}
                                >
                                  {formatCurrency(purchasePrice)}
                                </div>
                              </td>
                              <td className="p-2 text-right">{formatCurrency(product.cost)}</td>
                              <td className="p-2 text-right">
                                <div className="flex flex-col items-end">
                                  <span
                                    className={`${product.quantity <= product.reorderLevel ? "text-red-500 font-medium" : ""}`}
                                  >
                                    {product.quantity}
                                  </span>
                                  {product.quantity === 0 ? (
                                    <Badge variant="destructive" className="mt-1">
                                      Out of Stock
                                    </Badge>
                                  ) : product.quantity <= 5 ? (
                                    <Badge variant="destructive" className="mt-1">
                                      Critical
                                    </Badge>
                                  ) : product.quantity <= 10 ? (
                                    <Badge variant="warning" className="mt-1">
                                      Low Stock
                                    </Badge>
                                  ) : product.quantity <= product.reorderLevel ? (
                                    <Badge variant="outline" className="mt-1">
                                      Order Now
                                    </Badge>
                                  ) : null}
                                  {updatedBySupplier && (
                                    <Badge variant="secondary" className="mt-1">
                                      Updated by Supplier
                                    </Badge>
                                  )}
                                  {updatedByPurchases && (
                                    <Badge variant="secondary" className="mt-1">
                                      Updated from Purchase
                                    </Badge>
                                  )}
                                  {updatedBySales && (
                                    <Badge variant="secondary" className="mt-1">
                                      Updated from Sales
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditClick(product)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteClick(product._id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {pagination && pagination.total > 0 && (
                  <div className="p-2 border-t">
                    <DataTablePagination
                      totalItems={pagination.total}
                      pageSize={pageSize}
                      currentPage={pagination.page}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="order-now" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Now Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Products that are below their reorder level but above critical threshold.
              </p>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">SKU</th>
                        <th className="text-right p-2">Quantity</th>
                        <th className="text-right p-2">Reorder Level</th>
                        <th className="text-center p-2">Status</th>
                        <th className="text-center p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.filter((p) => p.quantity > 10 && p.quantity <= p.reorderLevel).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-4">
                            No products in "Order Now" status
                          </td>
                        </tr>
                      ) : (
                        products
                          .filter((p) => p.quantity > 10 && p.quantity <= p.reorderLevel)
                          .map((product) => (
                            <tr key={product._id} className="border-b hover:bg-muted/50">
                              <td className="p-2">{product.name}</td>
                              <td className="p-2">{product.sku}</td>
                              <td className="p-2 text-right">{product.quantity}</td>
                              <td className="p-2 text-right">{product.reorderLevel}</td>
                              <td className="p-2 text-center">
                                <Badge variant="outline">Order Now</Badge>
                                {product.lastModifiedFrom === "suppliers" && (
                                  <div className="mt-1">
                                    <Badge variant="secondary">Updated by Supplier</Badge>
                                  </div>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(product)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Update
                                </Button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="critical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Critical Stock Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Products with critically low stock levels (5 or fewer items).
              </p>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">SKU</th>
                        <th className="text-right p-2">Quantity</th>
                        <th className="text-right p-2">Reorder Level</th>
                        <th className="text-center p-2">Status</th>
                        <th className="text-center p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.filter((p) => p.quantity > 0 && p.quantity <= 5).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-4">
                            No products with critical stock levels
                          </td>
                        </tr>
                      ) : (
                        products
                          .filter((p) => p.quantity > 0 && p.quantity <= 5)
                          .map((product) => (
                            <tr key={product._id} className="border-b hover:bg-muted/50">
                              <td className="p-2">{product.name}</td>
                              <td className="p-2">{product.sku}</td>
                              <td className="p-2 text-right">{product.quantity}</td>
                              <td className="p-2 text-right">{product.reorderLevel}</td>
                              <td className="p-2 text-center">
                                <Badge variant="destructive">Critical</Badge>
                                {product.lastModifiedFrom === "suppliers" && (
                                  <div className="mt-1">
                                    <Badge variant="secondary">Updated by Supplier</Badge>
                                  </div>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(product)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Update
                                </Button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Products with low stock levels (between 6 and 10 items).
              </p>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">SKU</th>
                        <th className="text-right p-2">Quantity</th>
                        <th className="text-right p-2">Reorder Level</th>
                        <th className="text-center p-2">Status</th>
                        <th className="text-center p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.filter((p) => p.quantity > 5 && p.quantity <= 10).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-4">
                            No products with low stock levels
                          </td>
                        </tr>
                      ) : (
                        products
                          .filter((p) => p.quantity > 5 && p.quantity <= 10)
                          .map((product) => (
                            <tr key={product._id} className="border-b hover:bg-muted/50">
                              <td className="p-2">{product.name}</td>
                              <td className="p-2">{product.sku}</td>
                              <td className="p-2 text-right">{product.quantity}</td>
                              <td className="p-2 text-right">{product.reorderLevel}</td>
                              <td className="p-2 text-center">
                                <Badge variant="warning">Low Stock</Badge>
                                {product.lastModifiedFrom === "suppliers" && (
                                  <div className="mt-1">
                                    <Badge variant="secondary">Updated by Supplier</Badge>
                                  </div>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(product)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Update
                                </Button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="out-of-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Out of Stock Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Products that have zero quantity in stock.</p>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">SKU</th>
                        <th className="text-right p-2">Reorder Level</th>
                        <th className="text-right p-2">Cost</th>
                        <th className="text-right p-2">Purchase Price</th>
                        <th className="text-center p-2">Status</th>
                        <th className="text-center p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.filter((p) => p.quantity === 0).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center p-4">
                            No out of stock products found
                          </td>
                        </tr>
                      ) : (
                        products
                          .filter((p) => p.quantity === 0)
                          .map((product) => (
                            <tr key={product._id} className="border-b hover:bg-muted/50">
                              <td className="p-2">{product.name}</td>
                              <td className="p-2">{product.sku}</td>
                              <td className="p-2 text-right">{product.reorderLevel}</td>
                              <td className="p-2 text-right">{formatCurrency(product.cost)}</td>
                              <td className="p-2 text-right">
                                {formatCurrency(product.purchasePrice || product.cost * 1.18)}
                              </td>
                              <td className="p-2 text-center">
                                <Badge variant="destructive">Out of Stock</Badge>
                                {product.lastModifiedFrom === "suppliers" && (
                                  <div className="mt-1">
                                    <Badge variant="secondary">Updated by Supplier</Badge>
                                  </div>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(product)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Update Stock
                                </Button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Enter the details of the new product. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={newProduct.name || ""}
                  onChange={(e) => handleNewProductChange("name", e.target.value)}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sku"
                  value={newProduct.sku || ""}
                  onChange={(e) => handleNewProductChange("sku", e.target.value)}
                  placeholder="Enter SKU"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newProduct.category || ""}
                  onValueChange={(value) => handleNewProductChange("category", value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category._id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Clothing">Clothing</SelectItem>
                        <SelectItem value="Food & Beverages">Food & Beverages</SelectItem>
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newProduct.quantity || 0}
                  onChange={(e) => handleNewProductChange("quantity", Number(e.target.value))}
                  placeholder="Enter quantity"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">
                  Cost Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cost"
                  type="number"
                  value={newProduct.cost || 0}
                  onChange={(e) => handleNewProductChange("cost", Number(e.target.value))}
                  placeholder="Enter cost price"
                />
                <p className="text-xs text-muted-foreground">Base cost of the product</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase-price">
                  Purchase Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="purchase-price"
                  type="number"
                  value={newProduct.purchasePrice || 0}
                  onChange={(e) => handleNewProductChange("purchasePrice", Number(e.target.value))}
                  placeholder="Enter purchase price"
                />
                <p className="text-xs text-muted-foreground">Cost + tax by default</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="selling-price">
                  Selling Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="selling-price"
                  type="number"
                  value={newProduct.sellingPrice || 0}
                  onChange={(e) => handleNewProductChange("sellingPrice", Number(e.target.value))}
                  placeholder="Enter selling price"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax">
                  Tax Rate (%) <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={String(newProduct.tax || 0)}
                  onValueChange={(value) => handleNewProductChange("tax", Number(value))}
                >
                  <SelectTrigger id="tax">
                    <SelectValue placeholder="Select tax rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder-level">
                  Reorder Level <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reorder-level"
                  type="number"
                  value={newProduct.reorderLevel || 10}
                  onChange={(e) => handleNewProductChange("reorderLevel", Number(e.target.value))}
                  placeholder="Enter reorder level"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">
                Supplier <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newProduct.supplierId || ""}
                onValueChange={(value) => handleNewProductChange("supplierId", value)}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.length > 0 ? (
                    suppliers.map((supplier) => (
                      <SelectItem key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="N/A">No suppliers available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProduct.description || ""}
                onChange={(e) => handleNewProductChange("description", e.target.value)}
                placeholder="Enter product description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddProductOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddProduct} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the product details. Click save when you're done.</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingProduct.name}
                    onChange={(e) => handleEditProductChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sku">
                    SKU <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-sku"
                    value={editingProduct.sku}
                    onChange={(e) => handleEditProductChange("sku", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editingProduct.category}
                    onChange={(value) => handleEditProductChange("category", value)}
                  >
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category._id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Clothing">Clothing</SelectItem>
                          <SelectItem value="Food & Beverages">Food & Beverages</SelectItem>
                          <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                          <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={editingProduct.quantity.toString()}
                    onChange={(e) => handleEditProductChange("quantity", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-cost">
                    Cost Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-cost"
                    type="number"
                    value={editingProduct.cost.toString()}
                    onChange={(e) => handleEditProductChange("cost", Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Base cost of the product</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-purchase-price">
                    Purchase Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-purchase-price"
                    type="number"
                    value={(
                      editingProduct.purchasePrice || editingProduct.cost * (1 + (editingProduct.tax || 0) / 100)
                    ).toString()}
                    onChange={(e) => handleEditProductChange("purchasePrice", Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Cost + tax by default</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-selling-price">
                    Selling Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-selling-price"
                    type="number"
                    value={(editingProduct.sellingPrice || 0).toString()}
                    onChange={(e) => handleEditProductChange("sellingPrice", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-tax">
                    Tax Rate (%) <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editingProduct.tax.toString()}
                    onChange={(value) => handleEditProductChange("tax", Number(value))}
                  >
                    <SelectTrigger id="edit-tax">
                      <SelectValue placeholder="Select tax rate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                      <SelectItem value="28">28%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-reorder-level">
                    Reorder Level <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-reorder-level"
                    type="number"
                    value={editingProduct.reorderLevel.toString()}
                    onChange={(e) => handleEditProductChange("reorderLevel", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supplier">
                  Supplier <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editingProduct.supplierId || ""}
                  onChange={(value) => handleEditProductChange("supplierId", value)}
                >
                  <SelectTrigger id="edit-supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.length > 0 ? (
                      suppliers.map((supplier) => (
                        <SelectItem key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="N/A">No suppliers available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProduct.description || ""}
                  onChange={(e) => handleEditProductChange("description", e.target.value)}
                  placeholder="Enter product description"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditProductOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleEditProduct} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={isViewProductOpen} onOpenChange={setIsViewProductOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Product Name</h4>
                  <p className="text-base">{selectedProduct.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">SKU</h4>
                  <p className="text-base">{selectedProduct.sku}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                  <p className="text-base">{selectedProduct.category}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Quantity</h4>
                  <p className="text-base">{selectedProduct.quantity}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Cost Price</h4>
                  <p className="text-base">{formatCurrency(selectedProduct.cost)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Purchase Price</h4>
                  <p className="text-base">
                    {formatCurrency(selectedProduct.purchasePrice || selectedProduct.cost * 1.18)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Selling Price</h4>
                  <p className="text-base">{formatCurrency(selectedProduct.sellingPrice || 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Tax Rate</h4>
                  <p className="text-base">{selectedProduct.tax}%</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Reorder Level</h4>
                  <p className="text-base">{selectedProduct.reorderLevel}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Supplier</h4>
                <p className="text-base">{selectedSupplier ? selectedSupplier.name : "Not specified"}</p>
              </div>

              {selectedProduct.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                  <p className="text-base">{selectedProduct.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                  <p className="text-base">{selectedProduct.location || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">HSN Code</h4>
                  <p className="text-base">{selectedProduct.hsn || "Not specified"}</p>
                </div>
              </div>

              {selectedProduct.lastModifiedFrom === "suppliers" && (
                <div className="mt-2 p-2 bg-muted/30 rounded-md border">
                  <h4 className="text-sm font-medium text-muted-foreground">Update Information</h4>
                  <div className="flex items-center mt-1">
                    <Badge variant="secondary">Updated by Supplier</Badge>
                    {selectedProduct.lastModified && (
                      <span className="text-sm ml-2">
                        on {new Date(selectedProduct.lastModified).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {selectedProduct.lastModifiedFrom === "purchases" && (
                <div className="mt-2 p-2 bg-muted/30 rounded-md border">
                  <h4 className="text-sm font-medium text-muted-foreground">Update Information</h4>
                  <div className="flex items-center mt-1">
                    <Badge variant="secondary">Updated from Purchase</Badge>
                    {selectedProduct.lastModified && (
                      <span className="text-sm ml-2">
                        on {new Date(selectedProduct.lastModified).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {selectedProduct.lastModifiedFrom === "sales" && (
                <div className="mt-2 p-2 bg-muted/30 rounded-md border">
                  <h4 className="text-sm font-medium text-muted-foreground">Update Information</h4>
                  <div className="flex items-center mt-1">
                    <Badge variant="secondary">Updated from Sales</Badge>
                    {selectedProduct.lastModified && (
                      <span className="text-sm ml-2">
                        on {new Date(selectedProduct.lastModified).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewProductOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsViewProductOpen(false)
                    handleEditClick(selectedProduct)
                  }}
                >
                  Edit
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
