"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { ViewDetailsDialog } from "@/components/invoices/view-details-dialog"
import { ExportDialog } from "@/components/invoices/export-dialog"
import { ConvertToSaleDialog } from "@/components/invoices/convert-to-sale-dialog"
import { generateInvoicePDF } from "@/utils/generate-invoice-pdf"
import { InvoicesTable } from "./invoices-table"
import { CreateInvoice } from "./create-invoice"

// Interface definitions remain the same...
interface Customer {
  _id: string
  name: string
  email: string
  contact: string
}

interface Product {
  _id: string
  name: string
  sellingPrice: number
  cost: number
  quantity: number
  taxRate?: number
  tax?: number
}

interface InvoiceItem {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
  originalPrice: number
  tax: number
  originalTax: number
  taxAmount: number
  total: number
  totalWithTax: number
}

interface Invoice {
  _id: string
  number: string
  date: string
  dueDate: string
  customerId: string
  customerName: string
  items: InvoiceItem[]
  subtotal: number
  taxTotal: number
  total: number
  status: "paid" | "pending" | "overdue" | "cancelled" | "draft"
  paymentMethod: string
  notes: string
  isGst: boolean
  createdAt?: string
  convertedToSale?: boolean
}

export default function InvoicesPageClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState("date")
  const [sortDirection, setSortDirection] = useState("desc")
  const itemsPerPage = 10
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("list")
  const [isDownloading, setIsDownloading] = useState(false)
  const [open, setOpen] = useState(false)

  // State for dialogs
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false)
  const [convertToSaleDialogOpen, setConvertToSaleDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState<string | null>(null)

  // Invoice statistics
  const [invoiceStats, setInvoiceStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
  })

  // Create Invoice State
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date())
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer")
  const [notes, setNotes] = useState("")
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)
  const [showWalkinInput, setShowWalkinInput] = useState(false)
  const [walkinCustomerName, setWalkinCustomerName] = useState("")
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [isGst, setIsGst] = useState("gst") // Default to GST invoice
  const [lastCreatedInvoiceId, setLastCreatedInvoiceId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    fetchInvoices()
    fetchCustomers()
    fetchProducts()
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [invoices, searchTerm, statusFilter, sortField, sortDirection])

  // Calculate invoice statistics whenever invoices change
  useEffect(() => {
    calculateInvoiceStats()
  }, [invoices])

  // Add effect to update tax calculations when GST status changes
  useEffect(() => {
    if (invoiceItems.length > 0) {
      updateAllItemTaxes(isGst === "gst")
    }
  }, [isGst])

  // Fetch recent invoices
  useEffect(() => {
    fetchRecentInvoices()
  }, [])

  const calculateInvoiceStats = () => {
    const total = invoices.length
    const paid = invoices.filter((inv) => inv.status === "paid").length
    const unpaid = invoices.filter((inv) => inv.status === "pending" || inv.status === "overdue").length

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0)
    const paidAmount = invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.total, 0)
    const unpaidAmount = invoices
      .filter((inv) => inv.status === "pending" || inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.total, 0)

    setInvoiceStats({
      total,
      paid,
      unpaid,
      totalAmount,
      paidAmount,
      unpaidAmount,
    })
  }

  const updateAllItemTaxes = (applyGst: boolean) => {
    setInvoiceItems(
      invoiceItems.map((item) => {
        // Use original tax rate if GST is enabled, otherwise set to 0
        const effectiveTaxRate = applyGst ? item.originalTax : 0

        if (applyGst) {
          // For GST invoices, calculate price without tax
          const sellingPrice = item.originalPrice
          const taxRate = effectiveTaxRate / 100
          const priceWithoutTax = sellingPrice / (1 + taxRate)
          const taxAmount = sellingPrice - priceWithoutTax

          return {
            ...item,
            tax: effectiveTaxRate,
            price: priceWithoutTax,
            taxAmount: taxAmount * item.quantity,
            total: priceWithoutTax * item.quantity,
            totalWithTax: sellingPrice * item.quantity,
          }
        } else {
          // For non-GST invoices, price is the same as selling price
          return {
            ...item,
            tax: 0,
            price: item.originalPrice,
            taxAmount: 0,
            total: item.originalPrice * item.quantity,
            totalWithTax: item.originalPrice * item.quantity,
          }
        }
      }),
    )
  }

  const fetchInvoices = async () => {
    try {
      setIsLoading(true)
      setLoading(true)
      setError(null)
      const response = await fetch("/api/invoice?limit=100")
      if (!response.ok) {
        throw new Error("Failed to fetch invoices")
      }
      const data = await response.json()

      // Check if data is an array (old API format) or has invoices property (new format)
      if (Array.isArray(data)) {
        setInvoices(data)
      } else if (data.invoices && Array.isArray(data.invoices)) {
        setInvoices(data.invoices)
      } else {
        console.error("Expected array or object with invoices array but got:", data)
        setInvoices([])
      }
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching invoices:", error)
      setError("Failed to fetch invoices. Please try again.")
      toast({
        title: "Error",
        description: "Failed to fetch invoices. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    setCustomersLoading(true)
    try {
      const response = await fetch("/api/customers")
      if (!response.ok) {
        throw new Error("Failed to fetch customers")
      }
      const data = await response.json()
      if (data.customers && Array.isArray(data.customers)) {
        setCustomers(data.customers)
      } else {
        console.error("Expected customers array but got:", data)
        setCustomers([])
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch customers. Please try again.",
        variant: "destructive",
      })
      setCustomers([])
    } finally {
      setCustomersLoading(false)
    }
  }

  const fetchProducts = async () => {
    setProductsLoading(true)
    try {
      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }
      const data = await response.json()
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products)
      } else {
        console.error("Expected products array but got:", data)
        setProducts([])
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products. Please try again.",
        variant: "destructive",
      })
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  const fetchRecentInvoices = async () => {
    try {
      const response = await fetch("/api/invoices/recent")
      if (!response.ok) throw new Error("Failed to fetch recent invoices")
      const data = await response.json()

      // Sort invoices by date (newest first)
      const sortedInvoices = data.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      setRecentInvoices(sortedInvoices)
    } catch (error) {
      console.error("Error fetching recent invoices:", error)
    }
  }

  // Filter invoices based on search term, status, and apply sorting
  const filterInvoices = () => {
    let filtered = [...invoices]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === "date") {
        return sortDirection === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime()
      } else if (sortField === "number") {
        return sortDirection === "asc" ? a.number.localeCompare(b.number) : b.number.localeCompare(a.number)
      } else if (sortField === "customer") {
        return sortDirection === "asc"
          ? a.customerName.localeCompare(b.customerName)
          : b.customerName.localeCompare(a.customerName)
      } else if (sortField === "total") {
        return sortDirection === "asc" ? a.total - b.total : b.total - a.total
      }
      return 0
    })

    setFilteredInvoices(filtered)
    setTotalPages(Math.ceil(filtered.length / itemsPerPage))
    setCurrentPage(1)
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value)
  }

  const handleSortChange = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Filter customers based on search term
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase())) ||
      (customer.contact && customer.contact.toLowerCase().includes(customerSearchTerm.toLowerCase())),
  )

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()),
  )

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "success"
      case "pending":
        return "warning"
      case "overdue":
        return "destructive"
      case "cancelled":
        return "outline"
      case "draft":
        return "secondary"
      default:
        return "default"
    }
  }

  const formatPaymentMethod = (method: string) => {
    if (!method) return ""
    return method
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Handle view invoice details
  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoiceId(invoice._id)
    setViewDetailsDialogOpen(true)
  }

  // Handle convert to sale
  const handleConvertToSale = (invoice: Invoice) => {
    setSelectedInvoiceId(invoice._id)
    setSelectedInvoiceNumber(invoice.number)
    setConvertToSaleDialogOpen(true)
  }

  const handleExport = () => {
    setExportDialogOpen(true)
  }

  // Download invoice as PDF
  const handleDownload = async (invoiceId: string) => {
    if (isDownloading) return

    setIsDownloading(true)

    try {
      toast({
        title: "Downloading...",
        description: "Preparing your invoice for download.",
      })

      const response = await fetch(`/api/invoice/${invoiceId}/download`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)
        throw new Error(errorText || "Failed to download invoice")
      }

      // If the response is a PDF, handle it directly
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/pdf")) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `invoice-${invoiceId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Invoice downloaded successfully!",
        })
        return
      }

      // If not a direct PDF, process the JSON data
      const data = await response.json()

      if (!data.invoice) {
        throw new Error("Invoice data is missing")
      }

      // Generate and download the PDF
      await generateInvoicePDF(data)

      toast({
        title: "Success",
        description: "Invoice downloaded successfully!",
      })
    } catch (error) {
      console.error("Error downloading invoice:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download invoice",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Mark invoice as paid
  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      toast({
        title: "Processing...",
        description: "Updating invoice status to paid.",
      })

      const response = await fetch(`/api/invoice`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: invoiceId,
          status: "paid",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update invoice status")
      }

      toast({
        title: "Success",
        description: "Invoice marked as paid successfully!",
      })

      // Refresh invoices list
      fetchInvoices()
    } catch (error) {
      console.error("Error marking invoice as paid:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update invoice status",
        variant: "destructive",
      })
    }
  }

  // Delete invoice
  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      return
    }

    try {
      toast({
        title: "Processing...",
        description: "Deleting invoice...",
      })

      const response = await fetch(`/api/invoice?id=${invoiceId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete invoice")
      }

      toast({
        title: "Success",
        description: "Invoice deleted successfully!",
      })

      // Refresh invoices list
      fetchInvoices()
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete invoice",
        variant: "destructive",
      })
    }
  }

  // Auto-refresh data every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchInvoices()
    }, 60000) // 60 seconds

    return () => clearInterval(intervalId)
  }, [])

  // Pagination
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Create and manage invoices for your customers</p>
        </div>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>
      <InvoicesTable />
      <CreateInvoice open={open} setOpen={setOpen} />
      {/* View Details Dialog */}
      <ViewDetailsDialog
        open={viewDetailsDialogOpen}
        onOpenChange={setViewDetailsDialogOpen}
        invoiceId={selectedInvoiceId}
        onDownload={handleDownload}
        onMarkAsPaid={handleMarkAsPaid}
      />

      {/* Convert to Sale Dialog */}
      <ConvertToSaleDialog
        open={convertToSaleDialogOpen}
        onOpenChange={setConvertToSaleDialogOpen}
        invoiceId={selectedInvoiceId}
        invoiceNumber={selectedInvoiceNumber}
        onSuccess={fetchInvoices}
      />

      {/* Export Dialog */}
      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
    </div>
  )
}
