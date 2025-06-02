"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import {
  Search,
  Plus,
  Filter,
  FileDown,
  MoreHorizontal,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  RefreshCcw,
  ShoppingCart,
  CreditCard,
  Check,
  X,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Interfaces
interface Customer {
  _id: string
  name: string
  email: string
  contact: string
}

interface SaleItem {
  product: string
  productName: string
  quantity: number
  price: number
  taxRate: number
  taxAmount: number
  total: number
}

interface Sale {
  _id: string
  customer: Customer
  saleDate: string
  items: SaleItem[]
  subtotal: number
  taxTotal: number
  total: number
  status: string
  paymentStatus: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface RefundItem extends SaleItem {
  selected: boolean
  refundQuantity: number
}

interface Refund {
  _id: string
  saleId: string
  orderNumber: string
  customer: Customer
  refundDate: string
  items: SaleItem[]
  subtotal: number
  taxTotal: number
  total: number
  reason: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function RefundsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  // State for refunds data
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [totalRefunds, setTotalRefunds] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Refund | "customer.name"
    direction: string
  } | null>(null)

  // State for create refund dialog
  const [isCreateRefundOpen, setIsCreateRefundOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sales, setSales] = useState<Sale[]>([])
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [refundItems, setRefundItems] = useState<RefundItem[]>([])
  const [refundToDelete, setRefundToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null)
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false)
  const [isLoadingSale, setIsLoadingSale] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    saleId: "",
    orderNumber: "",
    customer: "",
    refundDate: new Date().toISOString().split("T")[0],
    items: [] as SaleItem[],
    subtotal: 0,
    taxTotal: 0,
    total: 0,
    reason: "Damaged",
    status: "Pending",
    notes: "",
  })

  // Form errors
  const [formErrors, setFormErrors] = useState({
    saleId: "",
    items: "",
  })

  // Fetch refunds from API
  const fetchRefunds = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/refunds?page=${currentPage}&limit=${itemsPerPage}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to fetch refunds: ${response.status}`)
      }

      const data = await response.json()
      setRefunds(data.refunds || [])
      setTotalRefunds(data.pagination?.total || 0)
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      console.error("Error fetching refunds:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load refunds. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch sales from API
  const fetchSales = async () => {
    try {
      const response = await fetch("/api/sales")
      if (!response.ok) {
        throw new Error("Failed to fetch sales")
      }
      const data = await response.json()

      // Filter out sales that already have refunds
      const salesWithoutRefunds = data.sales.filter(
        (sale: Sale) => sale.status !== "Cancelled" && !refunds.some((refund) => refund.saleId === sale._id),
      )

      setSales(salesWithoutRefunds || [])
    } catch (error) {
      console.error("Error fetching sales:", error)
      toast({
        title: "Error",
        description: "Failed to load sales. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch sale by ID
  const fetchSaleById = async (saleId: string) => {
    try {
      setIsLoadingSale(true)
      const response = await fetch(`/api/sales/${saleId}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to fetch sale details: ${response.status}`)
      }

      const data = await response.json()
      if (!data.sale) {
        throw new Error("Sale data not found")
      }

      setSelectedSale(data.sale)

      // Convert sale items to refund items
      const items = data.sale.items.map((item: SaleItem) => ({
        ...item,
        selected: false,
        refundQuantity: 1,
      }))

      setRefundItems(items)

      // Update form data with sale info
      setFormData((prev) => ({
        ...prev,
        saleId: data.sale._id,
        orderNumber: data.sale._id.substring(0, 8),
        customer: data.sale.customer._id,
      }))
    } catch (error) {
      console.error("Error fetching sale:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load sale details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSale(false)
    }
  }

  // Fetch data on initial load and when page changes
  useEffect(() => {
    if (session) {
      fetchRefunds()
    }
  }, [session, currentPage, itemsPerPage])

  // Fetch sales when dialog opens
  useEffect(() => {
    if (isCreateRefundOpen) {
      fetchSales()
    }
  }, [isCreateRefundOpen])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user types
    if (name === "saleId" && formErrors.saleId) {
      setFormErrors((prev) => ({
        ...prev,
        saleId: "",
      }))
    }
  }

  // Handle sale selection
  const handleSaleSelect = (saleId: string) => {
    if (!saleId) {
      setSelectedSale(null)
      setRefundItems([])
      return
    }

    fetchSaleById(saleId)

    // Clear error
    if (formErrors.saleId) {
      setFormErrors((prev) => ({
        ...prev,
        saleId: "",
      }))
    }
  }

  // Handle item selection
  const handleItemSelect = (index: number, selected: boolean) => {
    const updatedItems = [...refundItems]
    updatedItems[index].selected = selected

    setRefundItems(updatedItems)

    // Clear error
    if (formErrors.items && selected) {
      setFormErrors((prev) => ({
        ...prev,
        items: "",
      }))
    }

    // Recalculate totals
    calculateTotals(updatedItems)
  }

  // Handle refund quantity change
  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1 || !refundItems[index].selected) return

    // Ensure quantity doesn't exceed original quantity
    const maxQuantity = refundItems[index].quantity
    const validQuantity = Math.min(Math.max(1, quantity), maxQuantity)

    const updatedItems = [...refundItems]
    updatedItems[index].refundQuantity = validQuantity

    setRefundItems(updatedItems)

    // Recalculate totals
    calculateTotals(updatedItems)
  }

  // Calculate totals
  const calculateTotals = (items: RefundItem[]) => {
    let subtotal = 0
    let taxTotal = 0

    items.forEach((item) => {
      if (item.selected) {
        const itemSubtotal = item.price * item.refundQuantity
        subtotal += itemSubtotal

        const itemTax = itemSubtotal * (item.taxRate / 100)
        taxTotal += itemTax
      }
    })

    const total = subtotal + taxTotal

    setFormData((prev) => ({
      ...prev,
      subtotal,
      taxTotal,
      total,
    }))
  }

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.saleId) {
      errors.saleId = "Order is required"
    }

    const hasSelectedItems = refundItems.some((item) => item.selected)
    if (!hasSelectedItems) {
      errors.items = "At least one item must be selected for refund"
    }

    // Validate quantities for selected items
    const invalidQuantities = refundItems
      .filter((item) => item.selected)
      .some((item) => item.refundQuantity <= 0 || item.refundQuantity > item.quantity)

    if (invalidQuantities) {
      errors.quantities = "Refund quantities must be greater than 0 and not exceed original quantities"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Prepare items for submission
  const prepareItemsForSubmission = () => {
    return refundItems
      .filter((item) => item.selected)
      .map((item) => ({
        product: item.product,
        productName: item.productName,
        quantity: item.refundQuantity,
        price: item.price,
        taxRate: item.taxRate,
        taxAmount: item.price * item.refundQuantity * (item.taxRate / 100),
        total: item.price * item.refundQuantity * (1 + item.taxRate / 100),
      }))
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      // Prepare items for submission
      const items = prepareItemsForSubmission()

      if (items.length === 0) {
        throw new Error("No valid items selected for refund")
      }

      const refundData = {
        ...formData,
        items,
      }

      const response = await fetch("/api/refunds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(refundData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to create refund: ${response.status}`)
      }

      // Reset form and close dialog
      setFormData({
        saleId: "",
        orderNumber: "",
        customer: "",
        refundDate: new Date().toISOString().split("T")[0],
        items: [],
        subtotal: 0,
        taxTotal: 0,
        total: 0,
        reason: "Damaged",
        status: "Pending",
        notes: "",
      })

      setSelectedSale(null)
      setRefundItems([])
      setIsCreateRefundOpen(false)
      fetchRefunds() // Refresh the refunds list

      toast({
        title: "Success",
        description: "Refund created successfully",
      })
    } catch (error) {
      console.error("Error creating refund:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create refund. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle refund deletion
  const handleDeleteRefund = async () => {
    if (!refundToDelete) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/refunds?id=${refundToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to delete refund: ${response.status}`)
      }

      fetchRefunds() // Refresh the refunds list

      toast({
        title: "Success",
        description: "Refund deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting refund:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete refund. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setRefundToDelete(null)
      setIsSubmitting(false)
    }
  }

  // Handle view details
  const handleViewDetails = (refund: Refund) => {
    setSelectedRefund(refund)
    setIsViewDetailsOpen(true)
  }

  // Sort function
  const requestSort = (key: keyof Refund | "customer.name") => {
    let direction = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Apply sorting, filtering and search
  const filteredAndSortedRefunds = () => {
    let filteredRefunds = [...refunds]

    // Apply status filter
    if (statusFilter !== "all") {
      filteredRefunds = filteredRefunds.filter((refund) => refund.status === statusFilter)
    }

    // Apply search
    if (searchTerm) {
      filteredRefunds = filteredRefunds.filter(
        (refund) =>
          refund.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          refund.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          refund.status.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply sorting
    if (sortConfig !== null) {
      filteredRefunds.sort((a, b) => {
        let aValue, bValue

        if (sortConfig.key === "customer.name") {
          aValue = a.customer.name
          bValue = b.customer.name
        } else {
          aValue = a[sortConfig.key as keyof Refund]
          bValue = b[sortConfig.key as keyof Refund]
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    return filteredRefunds
  }

  // Get current items for pagination
  const sortedAndFilteredRefunds = filteredAndSortedRefunds()

  // Render loading state
  if (loading && refunds.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Helper to render sort indicator
  const renderSortIcon = (key: keyof Refund | "customer.name") => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const handleUpdateStatus = async (refundId: string, newStatus: string) => {
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/refunds/${refundId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to update refund status: ${response.status}`)
      }

      fetchRefunds() // Refresh the refunds list

      toast({
        title: "Success",
        description: `Refund status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating refund status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update refund status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Refunds</h2>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateRefundOpen} onOpenChange={setIsCreateRefundOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Create Refund
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Create New Refund</DialogTitle>
                <DialogDescription>Fill in the details to create a new refund.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="saleId">
                      Order Number <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.saleId} onValueChange={handleSaleSelect}>
                      <SelectTrigger id="saleId">
                        <SelectValue placeholder="Select order" />
                      </SelectTrigger>
                      <SelectContent>
                        {sales.map((sale) => (
                          <SelectItem key={sale._id} value={sale._id}>
                            {sale._id.substring(0, 8)} - {sale.customer.name} ({formatCurrency(sale.total)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.saleId && <p className="text-sm text-red-500">{formErrors.saleId}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refundDate">Refund Date</Label>
                    <Input
                      id="refundDate"
                      name="refundDate"
                      type="date"
                      value={formData.refundDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {isLoadingSale ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : selectedSale ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>
                          Items to Refund <span className="text-red-500">*</span>
                        </Label>
                        <div className="text-sm text-muted-foreground">Select items to refund</div>
                      </div>

                      {formErrors.items && <p className="text-sm text-red-500">{formErrors.items}</p>}

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">Select</TableHead>
                              <TableHead>Product</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Original Qty</TableHead>
                              <TableHead>Refund Qty</TableHead>
                              <TableHead>Tax Rate</TableHead>
                              <TableHead>Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {refundItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Checkbox
                                    checked={item.selected}
                                    onCheckedChange={(checked) => handleItemSelect(index, checked as boolean)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{item.productName}</TableCell>
                                <TableCell>{formatCurrency(item.price)}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    max={item.quantity}
                                    value={item.refundQuantity}
                                    onChange={(e) => handleQuantityChange(index, Number.parseInt(e.target.value))}
                                    disabled={!item.selected}
                                    className="w-16"
                                  />
                                </TableCell>
                                <TableCell>{item.taxRate}%</TableCell>
                                <TableCell>
                                  {item.selected
                                    ? formatCurrency(item.price * item.refundQuantity * (1 + item.taxRate / 100))
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Refund</Label>
                        <Select
                          name="reason"
                          value={formData.reason}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, reason: value }))}
                        >
                          <SelectTrigger id="reason">
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Damaged">Damaged</SelectItem>
                            <SelectItem value="Defective">Defective</SelectItem>
                            <SelectItem value="Wrong Item">Wrong Item</SelectItem>
                            <SelectItem value="Customer Dissatisfaction">Customer Dissatisfaction</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          name="status"
                          value={formData.status}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Add any additional notes here"
                      />
                    </div>

                    <div className="space-y-2 border-t pt-4">
                      <div className="flex justify-between">
                        <span className="font-medium">Subtotal:</span>
                        <span>{formatCurrency(formData.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Tax:</span>
                        <span>{formatCurrency(formData.taxTotal)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Refund Amount:</span>
                        <span>{formatCurrency(formData.total)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-md border p-4 text-center text-muted-foreground">
                    Select an order to view items for refund
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateRefundOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || !selectedSale}>
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Refund"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>
            All Refunds
          </TabsTrigger>
          <TabsTrigger value="pending" onClick={() => setStatusFilter("Pending")}>
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" onClick={() => setStatusFilter("Approved")}>
            Approved
          </TabsTrigger>
          <TabsTrigger value="completed" onClick={() => setStatusFilter("Completed")}>
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
                <RefreshCcw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(refunds.reduce((sum, refund) => sum + refund.total, 0))}
                </div>
                <p className="text-xs text-muted-foreground">All time refund value</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Refund Count</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRefunds}</div>
                <p className="text-xs text-muted-foreground">All time refund count</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Refunds</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    refunds.filter((r) => r.status === "Pending").reduce((sum, refund) => sum + refund.total, 0),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {refunds.filter((r) => r.status === "Pending").length} refunds pending
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Refunds</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    refunds.filter((r) => {
                      const date = new Date(r.createdAt)
                      const now = new Date()
                      const diffTime = Math.abs(now.getTime() - date.getTime())
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                      return diffDays <= 30
                    }).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">In the last 30 days</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search refunds..."
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
                      <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Statuses</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("Pending")}>Pending</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("Approved")}>Approved</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("Rejected")}>Rejected</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("Completed")}>Completed</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm">
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="mt-6 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("orderNumber")}>
                        <div className="flex items-center">Order # {renderSortIcon("orderNumber")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("customer.name")}>
                        <div className="flex items-center">Customer {renderSortIcon("customer.name")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("refundDate")}>
                        <div className="flex items-center">Date {renderSortIcon("refundDate")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("total")}>
                        <div className="flex items-center">Amount {renderSortIcon("total")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("reason")}>
                        <div className="flex items-center">Reason {renderSortIcon("reason")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("status")}>
                        <div className="flex items-center">Status {renderSortIcon("status")}</div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredRefunds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No refunds found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedAndFilteredRefunds.map((refund) => (
                        <TableRow key={refund._id}>
                          <TableCell className="font-medium">{refund.orderNumber}</TableCell>
                          <TableCell>{refund.customer.name}</TableCell>
                          <TableCell>{formatDate(refund.refundDate)}</TableCell>
                          <TableCell>{formatCurrency(refund.total)}</TableCell>
                          <TableCell>{refund.reason}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                refund.status === "Completed"
                                  ? "success"
                                  : refund.status === "Rejected"
                                    ? "destructive"
                                    : refund.status === "Approved"
                                      ? "outline"
                                      : "secondary"
                              }
                            >
                              {refund.status}
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
                                <DropdownMenuItem onClick={() => handleViewDetails(refund)}>
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem>Edit refund</DropdownMenuItem>
                                {refund.status === "Pending" && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(refund._id, "Approved")}>
                                      <Check className="mr-2 h-4 w-4" /> Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(refund._id, "Rejected")}>
                                      <X className="mr-2 h-4 w-4" /> Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setRefundToDelete(refund._id)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                >
                                  Delete refund
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
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

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Refunds</CardTitle>
              <CardDescription>Refunds that are awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds
                    .filter((refund) => refund.status === "Pending")
                    .slice(0, 5)
                    .map((refund) => (
                      <TableRow key={refund._id}>
                        <TableCell className="font-medium">{refund.orderNumber}</TableCell>
                        <TableCell>{refund.customer.name}</TableCell>
                        <TableCell>{formatDate(refund.refundDate)}</TableCell>
                        <TableCell>{formatCurrency(refund.total)}</TableCell>
                        <TableCell>{refund.reason}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleUpdateStatus(refund._id, "Approved")}
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleUpdateStatus(refund._id, "Rejected")}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Refunds</CardTitle>
              <CardDescription>Refunds that have been approved but not yet completed</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds
                    .filter((refund) => refund.status === "Approved")
                    .slice(0, 5)
                    .map((refund) => (
                      <TableRow key={refund._id}>
                        <TableCell className="font-medium">{refund.orderNumber}</TableCell>
                        <TableCell>{refund.customer.name}</TableCell>
                        <TableCell>{formatDate(refund.refundDate)}</TableCell>
                        <TableCell>{formatCurrency(refund.total)}</TableCell>
                        <TableCell>{refund.reason}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(refund._id, "Completed")}>
                            Complete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Refunds</CardTitle>
              <CardDescription>Refunds that have been processed and completed</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds
                    .filter((refund) => refund.status === "Completed")
                    .slice(0, 5)
                    .map((refund) => (
                      <TableRow key={refund._id}>
                        <TableCell className="font-medium">{refund.orderNumber}</TableCell>
                        <TableCell>{refund.customer.name}</TableCell>
                        <TableCell>{formatDate(refund.refundDate)}</TableCell>
                        <TableCell>{formatCurrency(refund.total)}</TableCell>
                        <TableCell>{refund.reason}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the refund and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRefundToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRefund} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-[800px]">
          {selectedRefund && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Refund Details</span>
                  <Badge
                    variant={
                      selectedRefund.status === "Completed"
                        ? "success"
                        : selectedRefund.status === "Rejected"
                          ? "destructive"
                          : selectedRefund.status === "Approved"
                            ? "outline"
                            : "secondary"
                    }
                  >
                    {selectedRefund.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Order #{selectedRefund.orderNumber} - {formatDate(selectedRefund.refundDate)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="mb-2 font-semibold">Customer Information</h3>
                    <div className="rounded-md border p-3">
                      <p className="font-medium">{selectedRefund.customer.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedRefund.customer.email}</p>
                      <p className="text-sm text-muted-foreground">{selectedRefund.customer.contact}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">Refund Information</h3>
                    <div className="rounded-md border p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Reason:</p>
                          <p className="font-medium">{selectedRefund.reason}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Created:</p>
                          <p className="font-medium">{formatDate(selectedRefund.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Refunded Items</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Tax Rate</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRefund.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell>{formatCurrency(item.price)}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.taxRate}%</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="space-y-2 rounded-md border p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatCurrency(selectedRefund.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tax:</span>
                    <span>{formatCurrency(selectedRefund.taxTotal)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Total Refund Amount:</span>
                    <span>{formatCurrency(selectedRefund.total)}</span>
                  </div>
                </div>

                {selectedRefund.notes && (
                  <div>
                    <h3 className="mb-2 font-semibold">Notes</h3>
                    <div className="rounded-md border p-3">
                      <p className="text-sm">{selectedRefund.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                {selectedRefund.status === "Pending" && (
                  <>
                    <Button
                      variant="outline"
                      className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
                      onClick={() => {
                        handleUpdateStatus(selectedRefund._id, "Approved")
                        setIsViewDetailsOpen(false)
                      }}
                    >
                      <Check className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => {
                        handleUpdateStatus(selectedRefund._id, "Rejected")
                        setIsViewDetailsOpen(false)
                      }}
                    >
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
                {selectedRefund.status === "Approved" && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedRefund._id, "Completed")
                      setIsViewDetailsOpen(false)
                    }}
                  >
                    Complete Refund
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
