"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import {
  Search,
  Plus,
  Filter,
  FileDown,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  DollarSign,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  Eye,
  Edit,
  FileText,
  MoreHorizontal,
  Trash2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { DataTablePagination } from "@/components/data-table-pagination"
import { formatCurrency } from "@/utils/format-currency"
import { ViewDetailsDialog } from "@/components/sales/view-details-dialog"
import { EditSaleDialog } from "@/components/sales/edit-sale-dialog"
import { RecordPaymentDialog } from "@/components/sales/record-payment-dialog"
import { ExportDialog } from "@/components/sales/export-dialog"

// Import the error handling utilities
import { handleSaleCancellationError, type ErrorInfo } from "@/utils/error-handler"
import { ErrorFeedback } from "@/components/ui/error-feedback"

// At the top of the file, import the ErrorBoundary
import { ErrorBoundary } from "@/components/error-boundary"
import { useRouter } from "next/navigation"

// Interfaces
interface Customer {
  _id: string
  name: string
  email: string
  contact: string
}

interface Product {
  _id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  tax?: number
  sellingPrice?: number
  quantity?: number
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
  orderId?: string
  customer: Customer | null
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
  invoiceId?: string
  invoiceNumber?: string
}

interface DeleteSaleInfo {
  id: string
  status?: string
  items: {
    productId: string
    productName: string
    quantity: number
  }[]
}

// Modify the default export to wrap the component with ErrorBoundary
export default function SalesPageClient() {
  const { data: session, status: sessionStatus } = useSession()
  const { toast } = useToast()
  const router = useRouter()

  // State for sales data
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [totalSales, setTotalSales] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Sale | "customer.name"
    direction: string
  } | null>(null)
  const [todaySales, setTodaySales] = useState<Sale[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  })

  // State for dialogs
  const [isViewSaleOpen, setIsViewSaleOpen] = useState(false)
  const [isEditSaleOpen, setIsEditSaleOpen] = useState(false)
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  const [selectedSaleTotal, setSelectedSaleTotal] = useState(0)
  const [saleToDelete, setSaleToDelete] = useState<DeleteSaleInfo | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCompleteOrderDialogOpen, setIsCompleteOrderDialogOpen] = useState(false)
  const [saleToComplete, setSaleToComplete] = useState<string | null>(null)
  const [isReceiveOrderDialogOpen, setIsReceiveOrderDialogOpen] = useState(false)
  const [saleToReceive, setSaleToReceive] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  // Add state for error tracking
  const [cancellationError, setCancellationError] = useState<ErrorInfo | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Check if user is authenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login")
    }
  }, [sessionStatus, router])

  // Fetch sales from API
  const fetchSales = async (page = 1) => {
    try {
      if (sessionStatus !== "authenticated") return

      setLoading(true)
      const response = await fetch(`/api/sales?page=${page}&limit=${pagination.limit}`)

      if (!response.ok) {
        throw new Error("Failed to fetch sales")
      }

      const data = await response.json()
      setSales(data.sales || [])
      setPagination(data.pagination || pagination)
      setTotalSales(data.pagination?.total || 0)

      // Filter today's sales
      const today = new Date().toISOString().split("T")[0]
      const todaySalesData = (data.sales || []).filter((sale: Sale) => {
        const saleDate = new Date(sale.createdAt).toISOString().split("T")[0]
        return saleDate === today
      })
      setTodaySales(todaySalesData)

      setLoading(false)
    } catch (error) {
      console.error("Error fetching sales:", error)
      toast({
        title: "Error",
        description: "Failed to load sales. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      if (sessionStatus !== "authenticated") return

      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch data on initial load and when page changes
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchSales(currentPage)
      fetchProducts()
    }
  }, [sessionStatus, currentPage, itemsPerPage])

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionStatus === "authenticated") {
        fetchSales(currentPage)
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [sessionStatus, currentPage, itemsPerPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchSales(page)
  }

  // Handle view details
  const handleViewDetails = async (saleId: string) => {
    try {
      setActionError(null)
      setIsSubmitting(true)

      // Verify the user has permission to view this sale
      const response = await fetch(`/api/sales/${saleId}/verify-access`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "You don't have permission to view this sale")
      }

      // If verification passes, open the dialog
      setSelectedSaleId(saleId)
      setIsViewSaleOpen(true)
    } catch (error) {
      console.error("Error verifying sale access:", error)
      toast({
        title: "Access Denied",
        description: error instanceof Error ? error.message : "You don't have permission to view this sale",
        variant: "destructive",
      })
      setActionError(error instanceof Error ? error.message : "Access verification failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit sale
  const handleEditSale = async (saleId: string) => {
    try {
      setActionError(null)
      setIsSubmitting(true)

      // Verify the user has permission to edit this sale
      const response = await fetch(`/api/sales/${saleId}/verify-access`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "You don't have permission to edit this sale")
      }

      // Check if the sale is in an editable state
      const saleResponse = await fetch(`/api/sales/${saleId}`)
      if (!saleResponse.ok) {
        throw new Error("Failed to fetch sale details")
      }

      const saleData = await saleResponse.json()
      const sale = saleData.sale

      if (sale.status === "Cancelled") {
        throw new Error("Cancelled sales cannot be edited")
      }

      if (sale.status === "Completed") {
        throw new Error("Completed sales cannot be edited")
      }

      // If verification passes, open the dialog
      setSelectedSaleId(saleId)
      setIsEditSaleOpen(true)
    } catch (error) {
      console.error("Error verifying sale access for edit:", error)
      toast({
        title: "Cannot Edit Sale",
        description: error instanceof Error ? error.message : "You don't have permission to edit this sale",
        variant: "destructive",
      })
      setActionError(error instanceof Error ? error.message : "Edit verification failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle record payment
  const handleRecordPayment = async (saleId: string, total: number) => {
    try {
      setActionError(null)
      setIsSubmitting(true)

      // Verify the user has permission to record payment for this sale
      const response = await fetch(`/api/sales/${saleId}/verify-access`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "You don't have permission to record payment for this sale")
      }

      // Check if the sale is in a state where payment can be recorded
      const saleResponse = await fetch(`/api/sales/${saleId}`)
      if (!saleResponse.ok) {
        throw new Error("Failed to fetch sale details")
      }

      const saleData = await saleResponse.json()
      const sale = saleData.sale

      if (sale.status === "Cancelled") {
        throw new Error("Cannot record payment for cancelled sales")
      }

      if (sale.paymentStatus === "Paid") {
        throw new Error("Payment has already been recorded for this sale")
      }

      // If verification passes, open the dialog
      setSelectedSaleId(saleId)
      setSelectedSaleTotal(total)
      setIsRecordPaymentOpen(true)
    } catch (error) {
      console.error("Error verifying sale access for payment:", error)
      toast({
        title: "Cannot Record Payment",
        description:
          error instanceof Error ? error.message : "You don't have permission to record payment for this sale",
        variant: "destructive",
      })
      setActionError(error instanceof Error ? error.message : "Payment verification failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle payment recorded callback
  const handlePaymentRecorded = () => {
    // Immediately update the payment status in the local state
    if (selectedSaleId) {
      setSales((prevSales) =>
        prevSales.map((sale) => (sale._id === selectedSaleId ? { ...sale, paymentStatus: "Paid" } : sale)),
      )

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      })
    }

    // Also refresh the sales list to ensure all data is up to date
    fetchSales(currentPage)
  }

  // Handle create invoice
  const handleCreateInvoice = async (saleId: string) => {
    try {
      setActionError(null)
      setIsSubmitting(true)

      // Verify the user has permission to create an invoice for this sale
      const response = await fetch(`/api/sales/${saleId}/verify-access`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "You don't have permission to create an invoice for this sale")
      }

      toast({
        title: "Creating Invoice",
        description: "Please wait while we create the invoice...",
      })

      const invoiceResponse = await fetch(`/api/invoice/from-sale?saleId=${saleId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!invoiceResponse.ok) {
        const errorData = await invoiceResponse.json().catch(() => ({}))

        // Check if invoice already exists
        if (invoiceResponse.status === 400 && errorData.invoiceId) {
          toast({
            title: "Invoice Already Exists",
            description: `Invoice ${errorData.invoiceNumber} already exists for this sale.`,
          })

          // Refresh the sales list to update the invoice reference
          fetchSales(currentPage)

          // Redirect to invoices page after a short delay
          setTimeout(() => {
            router.push(`/invoices`)
          }, 1500)

          return
        }

        throw new Error(errorData.message || "Failed to create invoice")
      }

      const data = await invoiceResponse.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to create invoice")
      }

      toast({
        title: "Success",
        description: `Invoice ${data.invoiceNumber} created successfully`,
      })

      // Refresh the sales list to update the invoice reference
      fetchSales(currentPage)

      // Redirect to invoices page after a short delay
      setTimeout(() => {
        router.push(`/invoices`)
      }, 1500)
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice. Please try again.",
        variant: "destructive",
      })
      setActionError(error instanceof Error ? error.message : "Invoice creation failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Prepare sale for deletion
  const prepareSaleForDeletion = async (saleId: string) => {
    try {
      setActionError(null)
      setIsSubmitting(true)

      // Verify the user has permission to delete this sale
      const response = await fetch(`/api/sales/${saleId}/verify-access`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "You don't have permission to delete this sale")
      }

      // Get sale details to show product information in confirmation dialog
      const saleResponse = await fetch(`/api/sales/${saleId}`)
      if (!saleResponse.ok) {
        const errorData = await saleResponse.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to fetch sale details")
      }

      const data = await saleResponse.json()
      const sale = data.sale

      // For all sales, show what products will be affected
      const items = sale.items.map((item: SaleItem) => ({
        productId: item.product,
        productName: item.productName,
        quantity: item.quantity,
      }))

      setSaleToDelete({
        id: saleId,
        status: sale.status,
        items: items,
      })

      setIsDeleteDialogOpen(true)
    } catch (error) {
      console.error("Error preparing sale for deletion:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to prepare sale for deletion. Please try again.",
        variant: "destructive",
      })
      setActionError(error instanceof Error ? error.message : "Delete preparation failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle sale deletion (now actually cancels the sale)
  const handleDeleteSale = async () => {
    if (!saleToDelete) return

    try {
      setIsSubmitting(true)
      setCancellationError(null) // Clear any previous errors

      // First, get the current sale to check its status
      const saleResponse = await fetch(`/api/sales/${saleToDelete.id}`)
      if (!saleResponse.ok) {
        const errorData = await saleResponse.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to fetch sale details")
      }

      const saleData = await saleResponse.json()
      const sale = saleData.sale

      if (!sale) {
        throw new Error("Sale information could not be retrieved")
      }

      // Check if the sale has an invoice
      if (sale.invoiceId) {
        // We need to check if the invoice can be cancelled
        const invoiceResponse = await fetch(`/api/invoices/${sale.invoiceId}/status`)
        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json()

          // If the invoice is paid, we can't cancel the sale
          if (invoiceData.status === "Paid") {
            throw new Error("Cannot cancel a sale with a paid invoice. Please void the invoice first.")
          }
        }
      }

      // If the sale is in "Draft" or "Ordered" status, we can just delete it
      if (sale.status === "Draft" || sale.status === "Ordered") {
        const deleteResponse = await fetch(`/api/sales/${saleToDelete.id}`, {
          method: "DELETE",
        })

        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json().catch(() => ({}))
          throw new Error(errorData.message || "Failed to delete sale")
        }

        toast({
          title: "Success",
          description: "Sale deleted successfully",
        })

        fetchSales(currentPage) // Refresh the sales list
        setIsDeleteDialogOpen(false)
        setSaleToDelete(null)
        return
      }

      // For "Completed" sales, we need to check if restoring inventory would result in negative quantities
      if (sale.status === "Completed") {
        // Check if any product would go negative
        for (const item of saleToDelete.items) {
          try {
            // Get current product
            const productResponse = await fetch(`/api/products/${item.productId}`)
            if (!productResponse.ok) continue

            const productData = await productResponse.json()
            const product = productData.product

            // If product doesn't exist, skip it
            if (!product) continue

            // Check if restoring would result in negative quantity
            // This shouldn't normally happen, but we check just in case
            if ((product.quantity || 0) + item.quantity < 0) {
              toast({
                title: "Error",
                description: `Cannot cancel sale: Product "${item.productName}" would have negative inventory.`,
                variant: "destructive",
              })
              setIsSubmitting(false)
              return
            }
          } catch (error) {
            console.error("Error checking product quantity:", error)
          }
        }
      }

      // Update the sale status to "Cancelled"
      const response = await fetch(`/api/sales/${saleToDelete.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Cancelled",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to cancel sale")
      }

      // If the sale was completed, restore the product quantities
      if (sale.status === "Completed") {
        // Create a queue of promises for inventory updates
        const inventoryUpdatePromises = saleToDelete.items.map(async (item) => {
          try {
            // Get current product
            const productResponse = await fetch(`/api/products/${item.productId}`)
            if (!productResponse.ok) {
              throw new Error(`Failed to fetch product: ${item.productId}`)
            }

            const productData = await productResponse.json()
            const product = productData.product

            if (!product) {
              throw new Error(`Product not found: ${item.productId}`)
            }

            // Increase product quantity (restore)
            const newQuantity = (product.quantity || 0) + item.quantity

            const updateResponse = await fetch(`/api/products/${item.productId}/quantity`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                quantity: newQuantity,
                lastModified: new Date(),
                lastModifiedFrom: "sales-cancellation",
              }),
            })

            if (!updateResponse.ok) {
              throw new Error(`Failed to update product quantity: ${item.productId}`)
            }

            return { success: true, productId: item.productId }
          } catch (error) {
            console.error("Error updating product quantity:", error)
            return { success: false, productId: item.productId, error }
          }
        })

        // Wait for all inventory updates to complete
        const inventoryResults = await Promise.allSettled(inventoryUpdatePromises)

        // Check if any inventory updates failed
        const failedUpdates = inventoryResults
          .filter((result) => result.status === "rejected" || (result.status === "fulfilled" && !result.value.success))
          .map((result) => {
            if (result.status === "rejected") {
              return { error: result.reason }
            } else {
              return (result as PromiseFulfilledResult<any>).value
            }
          })

        if (failedUpdates.length > 0) {
          console.warn("Some inventory updates failed:", failedUpdates)
          // We continue anyway since the sale was cancelled successfully
        }
      }

      // If the sale has an invoice, update the invoice status
      if (sale.invoiceId) {
        try {
          const invoiceResponse = await fetch(`/api/invoices/${sale.invoiceId}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "Void",
              reason: "Sale cancelled",
            }),
          })

          if (!invoiceResponse.ok) {
            console.warn("Failed to update invoice status, but sale was cancelled successfully")
          }
        } catch (error) {
          console.error("Error updating invoice status:", error)
        }
      }

      toast({
        title: "Success",
        description: "Sale cancelled successfully" + (sale.status === "Completed" ? " and inventory restored" : ""),
      })

      fetchSales(currentPage) // Refresh the sales list
    } catch (error) {
      console.error("Error cancelling sale:", error)

      // Use our error handler to process this error
      const errorInfo = handleSaleCancellationError(error)
      setCancellationError(errorInfo)

      // Don't close the dialog so user can see the error and retry
      return
    } finally {
      setIsSubmitting(false)

      // Only close dialog if no errors
      if (!cancellationError) {
        setIsDeleteDialogOpen(false)
        setSaleToDelete(null)
      }
    }
  }

  // Handle complete order
  const handleCompleteOrder = async () => {
    if (!saleToComplete) return

    try {
      setActionError(null)
      setIsSubmitting(true)

      // Verify the user has permission to complete this order
      const response = await fetch(`/api/sales/${saleToComplete}/verify-access`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "You don't have permission to complete this order")
      }

      // Check if the sale is in a state where it can be completed
      const saleResponse = await fetch(`/api/sales/${saleToComplete}`)
      if (!saleResponse.ok) {
        throw new Error("Failed to fetch sale details")
      }

      const saleData = await saleResponse.json()
      const sale = saleData.sale

      if (sale.status !== "Pending") {
        throw new Error(`Cannot complete a sale with status "${sale.status}"`)
      }

      // Use the complete endpoint which handles both status change and inventory updates
      const completeResponse = await fetch(`/api/sales/${saleToComplete}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to complete order")
      }

      const data = await completeResponse.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to complete order")
      }

      // Immediately update the sale status in the local state
      setSales((prevSales) =>
        prevSales.map((sale) => (sale._id === saleToComplete ? { ...sale, status: "Completed" } : sale)),
      )

      toast({
        title: "Order Completed Successfully",
        description: "The order has been marked as completed and product quantities have been updated in inventory.",
      })

      // Also refresh the sales list to ensure all data is up to date
      fetchSales(currentPage)
    } catch (error) {
      console.error("Error completing order:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete order. Please try again.",
        variant: "destructive",
      })
      setActionError(error instanceof Error ? error.message : "Order completion failed")
    } finally {
      setIsCompleteOrderDialogOpen(false)
      setSaleToComplete(null)
      setIsSubmitting(false)
    }
  }

  // Handle receive order
  const handleReceiveOrder = async () => {
    if (!saleToReceive) return

    try {
      setActionError(null)
      setIsSubmitting(true)

      // Verify the user has permission to mark this order as received
      const response = await fetch(`/api/sales/${saleToReceive}/verify-access`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "You don't have permission to mark this order as received")
      }

      // Check if the sale is in a state where it can be marked as received
      const saleResponse = await fetch(`/api/sales/${saleToReceive}`)
      if (!saleResponse.ok) {
        throw new Error("Failed to fetch sale details")
      }

      const saleData = await saleResponse.json()
      const sale = saleData.sale

      if (sale.status !== "Pending") {
        throw new Error(`Cannot mark a sale with status "${sale.status}" as received`)
      }

      // Use the receive endpoint which handles both status change and inventory updates
      const receiveResponse = await fetch(`/api/sales/${saleToReceive}/receive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!receiveResponse.ok) {
        const errorData = await receiveResponse.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to mark order as received")
      }

      const data = await receiveResponse.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to mark order as received")
      }

      // Immediately update the sale status in the local state
      setSales((prevSales) =>
        prevSales.map((sale) => (sale._id === saleToReceive ? { ...sale, status: "Received" } : sale)),
      )

      toast({
        title: "Order Marked as Received",
        description: "The order has been marked as received and product quantities have been updated in inventory.",
      })

      // Also refresh the sales list to ensure all data is up to date
      fetchSales(currentPage)
    } catch (error) {
      console.error("Error marking order as received:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark order as received. Please try again.",
        variant: "destructive",
      })
      setActionError(error instanceof Error ? error.message : "Order receive operation failed")
    } finally {
      setIsReceiveOrderDialogOpen(false)
      setSaleToReceive(null)
      setIsSubmitting(false)
    }
  }

  // Sort function
  const requestSort = (key: keyof Sale | "customer.name") => {
    let direction = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Apply sorting, filtering and search
  const filteredAndSortedSales = () => {
    let filteredSales = [...sales]

    // Apply status filter
    if (statusFilter !== "all") {
      filteredSales = filteredSales.filter((sale) => sale.status === statusFilter)
    }

    // Apply search
    if (searchTerm) {
      filteredSales = filteredSales.filter(
        (sale) =>
          sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sale.invoiceNumber && sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply sorting
    if (sortConfig !== null) {
      filteredSales.sort((a, b) => {
        let aValue, bValue

        if (sortConfig.key === "customer.name") {
          aValue = a.customer?.name || ""
          bValue = b.customer?.name || ""
        } else {
          aValue = a[sortConfig.key as keyof Sale]
          bValue = b[sortConfig.key as keyof Sale]
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

    return filteredSales
  }

  // Get current items for pagination
  const sortedAndFilteredSales = filteredAndSortedSales()

  // Render loading state
  if (loading && sales.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Helper to render sort indicator
  const renderSortIcon = (key: keyof Sale | "customer.name") => {
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

  // Wrap the return with ErrorBoundary
  return (
    <ErrorBoundary>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
          <div className="flex items-center gap-2">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/sales/create")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Sale Order
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>
              All Sales
            </TabsTrigger>
            <TabsTrigger value="pending" onClick={() => setStatusFilter("Pending")}>
              Pending
            </TabsTrigger>
            <TabsTrigger value="completed" onClick={() => setStatusFilter("Completed")}>
              Completed
            </TabsTrigger>
            <TabsTrigger value="received" onClick={() => setStatusFilter("Received")}>
              Received
            </TabsTrigger>
            <TabsTrigger value="cancelled" onClick={() => setStatusFilter("Cancelled")}>
              Cancelled
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(sales.reduce((sum, sale) => sum + sale.total, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">All time sales value</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSales}</div>
                  <p className="text-xs text-muted-foreground">All time sales count</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      sales.filter((s) => s.paymentStatus !== "Paid").reduce((sum, sale) => sum + sale.total, 0),
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sales.filter((s) => s.paymentStatus !== "Paid").length} orders pending payment
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todaySales.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(todaySales.reduce((sum, sale) => sum + sale.total, 0))}
                  </p>
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
                        placeholder="Search sales..."
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
                        <DropdownMenuItem onClick={() => setStatusFilter("Completed")}>Completed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("Cancelled")}>Cancelled</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" onClick={() => setIsExportDialogOpen(true)}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="mt-6 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[120px]">Sale Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-center w-[200px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndFilteredSales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No sales found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedAndFilteredSales.map((sale) => (
                          <TableRow key={sale._id}>
                            <TableCell className="font-medium">{sale.orderId || sale._id.substring(0, 8)}</TableCell>
                            <TableCell>{sale.customer?.name || "Unknown Customer"}</TableCell>
                            <TableCell>{formatDate(sale.saleDate)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(sale.total)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  sale.status === "Completed"
                                    ? "success"
                                    : sale.status === "Received"
                                      ? "outline"
                                      : sale.status === "Cancelled"
                                        ? "destructive"
                                        : "secondary"
                                }
                                className="w-24 justify-center"
                              >
                                {sale.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={sale.paymentStatus === "Paid" ? "success" : "destructive"}
                                className="w-20 justify-center"
                              >
                                {sale.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleViewDetails(sale._id)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>

                                    {sale.status !== "Cancelled" && sale.status !== "Completed" && (
                                      <DropdownMenuItem onClick={() => handleEditSale(sale._id)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Sale
                                      </DropdownMenuItem>
                                    )}

                                    {sale.paymentStatus !== "Paid" && sale.status !== "Cancelled" && (
                                      <DropdownMenuItem onClick={() => handleRecordPayment(sale._id, sale.total)}>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Record Payment
                                      </DropdownMenuItem>
                                    )}

                                    {sale.status === "Pending" && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSaleToComplete(sale._id)
                                            setIsCompleteOrderDialogOpen(true)
                                          }}
                                        >
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          Mark as Completed
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSaleToReceive(sale._id)
                                            setIsReceiveOrderDialogOpen(true)
                                          }}
                                        >
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          Mark as Received
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    {!sale.invoiceId && sale.status !== "Cancelled" && (
                                      <DropdownMenuItem
                                        onClick={() => handleCreateInvoice(sale._id)}
                                        disabled={isSubmitting}
                                      >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Create Invoice
                                      </DropdownMenuItem>
                                    )}

                                    {sale.status !== "Cancelled" && (
                                      <DropdownMenuItem
                                        onClick={() => prepareSaleForDeletion(sale._id)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Cancel Sale
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4">
                  <DataTablePagination
                    totalItems={pagination.total}
                    pageSize={pagination.limit}
                    currentPage={pagination.page}
                    onPageChange={handlePageChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Sales</CardTitle>
                <CardDescription>Sales that are awaiting processing or fulfillment</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales
                      .filter((sale) => sale.status === "Pending")
                      .slice(0, 5)
                      .map((sale) => (
                        <TableRow key={sale._id}>
                          <TableCell className="font-medium">{sale.orderId || sale._id.substring(0, 8)}</TableCell>
                          <TableCell>{sale.customer?.name || "Unknown Customer"}</TableCell>
                          <TableCell>{formatDate(sale.saleDate)}</TableCell>
                          <TableCell>{formatCurrency(sale.total)}</TableCell>
                          <TableCell>
                            <Badge variant={sale.paymentStatus === "Paid" ? "success" : "destructive"}>
                              {sale.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleViewDetails(sale._id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditSale(sale._id)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Sale
                                  </DropdownMenuItem>
                                  {!sale.invoiceId && (
                                    <DropdownMenuItem onClick={() => handleCreateInvoice(sale._id)}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Create Invoice
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
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
                <CardTitle>Completed Sales</CardTitle>
                <CardDescription>Sales that have been fulfilled and completed</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales
                      .filter((sale) => sale.status === "Completed")
                      .slice(0, 5)
                      .map((sale) => (
                        <TableRow key={sale._id}>
                          <TableCell className="font-medium">{sale.orderId || sale._id.substring(0, 8)}</TableCell>
                          <TableCell>{sale.customer?.name || "Unknown Customer"}</TableCell>
                          <TableCell>{formatDate(sale.saleDate)}</TableCell>
                          <TableCell>{formatCurrency(sale.total)}</TableCell>
                          <TableCell>
                            <Badge variant={sale.paymentStatus === "Paid" ? "success" : "destructive"}>
                              {sale.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleViewDetails(sale._id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {!sale.invoiceId && (
                                    <DropdownMenuItem onClick={() => handleCreateInvoice(sale._id)}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Create Invoice
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Received Sales</CardTitle>
                <CardDescription>Sales that have been received</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales
                      .filter((sale) => sale.status === "Received")
                      .slice(0, 5)
                      .map((sale) => (
                        <TableRow key={sale._id}>
                          <TableCell className="font-medium">{sale.orderId || sale._id.substring(0, 8)}</TableCell>
                          <TableCell>{sale.customer?.name || "Unknown Customer"}</TableCell>
                          <TableCell>{formatDate(sale.saleDate)}</TableCell>
                          <TableCell>{formatCurrency(sale.total)}</TableCell>
                          <TableCell>
                            <Badge variant={sale.paymentStatus === "Paid" ? "success" : "destructive"}>
                              {sale.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleViewDetails(sale._id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {!sale.invoiceId && (
                                    <DropdownMenuItem onClick={() => handleCreateInvoice(sale._id)}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Create Invoice
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cancelled Sales</CardTitle>
                <CardDescription>Sales that have been cancelled</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales
                      .filter((sale) => sale.status === "Cancelled")
                      .slice(0, 5)
                      .map((sale) => (
                        <TableRow key={sale._id}>
                          <TableCell className="font-medium">{sale.orderId || sale._id.substring(0, 8)}</TableCell>
                          <TableCell>{sale.customer?.name || "Unknown Customer"}</TableCell>
                          <TableCell>{formatDate(sale.saleDate)}</TableCell>
                          <TableCell>{formatCurrency(sale.total)}</TableCell>
                          <TableCell>
                            <Badge variant={sale.paymentStatus === "Paid" ? "success" : "destructive"}>
                              {sale.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleViewDetails(sale._id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Sale Dialog */}
        <ViewDetailsDialog open={isViewSaleOpen} onOpenChange={setIsViewSaleOpen} saleId={selectedSaleId} />

        {/* Edit Sale Dialog */}
        <EditSaleDialog
          open={isEditSaleOpen}
          onOpenChange={setIsEditSaleOpen}
          saleId={selectedSaleId}
          onSaleUpdated={fetchSales}
        />

        {/* Record Payment Dialog */}
        <RecordPaymentDialog
          open={isRecordPaymentOpen}
          onOpenChange={setIsRecordPaymentOpen}
          saleId={selectedSaleId}
          totalAmount={selectedSaleTotal}
          onPaymentRecorded={handlePaymentRecorded}
        />

        {/* Export Dialog */}
        <ExportDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen} />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this sale?</AlertDialogTitle>
              <AlertDialogDescription>
                {saleToDelete && (
                  <>
                    {saleToDelete.items.length > 0 ? (
                      <>
                        <p>This will cancel the sale and change its status to "Cancelled".</p>
                        {saleToDelete.status === "Completed" && <p>Items will be returned to inventory.</p>}
                        <p className="mt-2 font-medium">
                          {saleToDelete.status === "Completed"
                            ? "The following items will be returned to inventory:"
                            : "The following items are part of this sale:"}
                        </p>
                        <ul className="mt-1 list-disc pl-5">
                          {saleToDelete.items.map((item, index) => (
                            <li key={index}>
                              {item.productName} - {item.quantity} units
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      "This action will cancel the sale and change its status to 'Cancelled'."
                    )}
                    {cancellationError && <ErrorFeedback error={cancellationError} />}
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSaleToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSale} className="bg-red-600 hover:bg-red-700">
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  "Cancel Sale"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Complete Order Confirmation Dialog */}
        <AlertDialog open={isCompleteOrderDialogOpen} onOpenChange={setIsCompleteOrderDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete this order?</AlertDialogTitle>
              <AlertDialogDescription>
                Marking this order as completed will reduce the following product quantities in inventory:
                <div className="mt-2 max-h-40 overflow-y-auto rounded border p-2">
                  {sales
                    .find((s) => s._id === saleToComplete)
                    ?.items.map((item, index) => (
                      <div key={index} className="mb-1 flex justify-between">
                        <span>{item.productName}</span>
                        <span className="font-semibold">-{item.quantity} units</span>
                      </div>
                    ))}
                </div>
                <p className="mt-2 text-sm font-medium text-destructive">This action cannot be easily undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSaleToComplete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCompleteOrder} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  "Complete Order"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Receive Order Confirmation Dialog */}
        <AlertDialog open={isReceiveOrderDialogOpen} onOpenChange={setIsReceiveOrderDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark this order as received?</AlertDialogTitle>
              <AlertDialogDescription>
                Marking this order as received will reduce the following product quantities in inventory:
                <div className="mt-2 max-h-40 overflow-y-auto rounded border p-2">
                  {sales
                    .find((s) => s._id === saleToReceive)
                    ?.items.map((item, index) => (
                      <div key={index} className="mb-1 flex justify-between">
                        <span>{item.productName}</span>
                        <span className="font-semibold">-{item.quantity} units</span>
                      </div>
                    ))}
                </div>
                <p className="mt-2 text-sm font-medium text-destructive">This action cannot be easily undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSaleToReceive(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReceiveOrder} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  "Mark as Received"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  )
}
