"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
  Search,
  Plus,
  Filter,
  FileDown,
  MoreHorizontal,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Users,
  CreditCard,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

// Import the new components
import { ExportDialog } from "@/components/customers/export-dialog"
import { ViewDetailsDialog } from "@/components/customers/view-details-dialog"
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog"

// Interface for a customer
interface Customer {
  _id: string
  name: string
  email: string
  contact: string
  customerType: string
  gstin?: string
  address?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export default function CustomersPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Get current page from URL or default to 1
  const currentPage = Number(searchParams.get("page") || "1")
  const currentTab = searchParams.get("tab") || "all"
  const itemsPerPage = 10 // Fixed to 10 items per page as requested

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState(currentTab)
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Corporate tab pagination
  const [corporatePage, setCorporatePage] = useState(1)
  const [totalCorporate, setTotalCorporate] = useState(0)
  const [totalCorporatePages, setTotalCorporatePages] = useState(1)

  // Individual tab pagination
  const [individualPage, setIndividualPage] = useState(1)
  const [totalIndividual, setTotalIndividual] = useState(0)
  const [totalIndividualPages, setTotalIndividualPages] = useState(1)

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Customer
    direction: string
  } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    customerType: "Individual",
    gstin: "",
    address: "",
  })

  // Form errors
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    contact: "",
    customerType: "",
  })

  // Add these state variables in the CustomersPage component
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setLoading(true)
      console.log(`Fetching customers for page ${currentPage} with limit ${itemsPerPage}`)
      const response = await fetch(`/api/customers?page=${currentPage}&limit=${itemsPerPage}`)

      if (!response.ok) {
        throw new Error("Failed to fetch customers")
      }

      const data = await response.json()
      console.log("Fetched customers data:", data)
      setCustomers(data.customers || [])
      setTotalCustomers(data.pagination?.total || 0)
      setTotalPages(data.pagination?.pages || 1)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // Fetch corporate customers
  const fetchCorporateCustomers = async () => {
    try {
      const response = await fetch(`/api/customers?page=${corporatePage}&limit=${itemsPerPage}&type=Corporate`)

      if (!response.ok) {
        throw new Error("Failed to fetch corporate customers")
      }

      const data = await response.json()
      return {
        customers: data.customers || [],
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 1,
      }
    } catch (error) {
      console.error("Error fetching corporate customers:", error)
      return { customers: [], total: 0, pages: 1 }
    }
  }

  // Fetch individual customers
  const fetchIndividualCustomers = async () => {
    try {
      const response = await fetch(`/api/customers?page=${individualPage}&limit=${itemsPerPage}&type=Individual`)

      if (!response.ok) {
        throw new Error("Failed to fetch individual customers")
      }

      const data = await response.json()
      return {
        customers: data.customers || [],
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 1,
      }
    } catch (error) {
      console.error("Error fetching individual customers:", error)
      return { customers: [], total: 0, pages: 1 }
    }
  }

  // Fetch customers on initial load and when page changes
  useEffect(() => {
    if (session) {
      fetchCustomers()
    }
  }, [session, currentPage, itemsPerPage])

  // Handle tab change
  const handleTabChange = (value: string) => {
    setTypeFilter(value)

    // Update URL with tab
    const params = new URLSearchParams(searchParams)
    params.set("tab", value)
    params.set("page", "1") // Reset to page 1 when changing tabs
    router.push(`${pathname}?${params.toString()}`)
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  // Validate form
  const validateForm = () => {
    const errors = {
      name: "",
      email: "",
      contact: "",
      customerType: "",
    }

    let isValid = true

    if (!formData.name.trim()) {
      errors.name = "Name is required"
      isValid = false
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid"
      isValid = false
    }

    if (!formData.contact.trim()) {
      errors.contact = "Contact number is required"
      isValid = false
    }

    if (!formData.customerType) {
      errors.customerType = "Customer type is required"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      console.log("Submitting form data:", formData)

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response:", errorData)
        throw new Error(errorData.message || "Failed to add customer")
      }

      // Reset form and close dialog
      setFormData({
        name: "",
        email: "",
        contact: "",
        customerType: "Individual",
        gstin: "",
        address: "",
      })

      setIsAddCustomerOpen(false)
      fetchCustomers() // Refresh the customer list

      toast({
        title: "Success",
        description: "Customer added successfully",
      })
    } catch (error) {
      console.error("Error adding customer:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add customer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle customer deletion
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return

    try {
      const response = await fetch(`/api/customers?id=${customerToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete customer")
      }

      fetchCustomers() // Refresh the customer list

      toast({
        title: "Success",
        description: "Customer deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setCustomerToDelete(null)
    }
  }

  // Sort function
  const requestSort = (key: keyof Customer) => {
    let direction = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Apply sorting, filtering and search
  const filteredAndSortedCustomers = () => {
    let filteredCustomers = [...customers]

    // Apply type filter
    if (typeFilter !== "all") {
      filteredCustomers = filteredCustomers.filter((customer) => customer.customerType === typeFilter)
    }

    // Apply search
    if (searchTerm) {
      filteredCustomers = filteredCustomers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (customer.gstin && customer.gstin.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply sorting
    if (sortConfig !== null) {
      filteredCustomers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    return filteredCustomers
  }

  // Add this function to handle page changes
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  // Handle corporate page change
  const handleCorporatePageChange = async (page: number) => {
    setCorporatePage(page)
    const { customers, total, pages } = await fetchCorporateCustomers()
    setCustomers(customers)
    setTotalCorporate(total)
    setTotalCorporatePages(pages)
  }

  // Handle individual page change
  const handleIndividualPageChange = async (page: number) => {
    setIndividualPage(page)
    const { customers, total, pages } = await fetchIndividualCustomers()
    setCustomers(customers)
    setTotalIndividual(total)
    setTotalIndividualPages(pages)
  }

  // Load corporate and individual data when tabs are selected
  useEffect(() => {
    if (typeFilter === "Corporate") {
      const loadCorporateData = async () => {
        const { customers, total, pages } = await fetchCorporateCustomers()
        setCustomers(customers)
        setTotalCorporate(total)
        setTotalCorporatePages(pages)
      }
      loadCorporateData()
    } else if (typeFilter === "Individual") {
      const loadIndividualData = async () => {
        const { customers, total, pages } = await fetchIndividualCustomers()
        setCustomers(customers)
        setTotalIndividual(total)
        setTotalIndividualPages(pages)
      }
      loadIndividualData()
    }
  }, [typeFilter, corporatePage, individualPage])

  // Render loading state
  if (loading && customers.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Helper to render sort indicator
  const renderSortIcon = (key: keyof Customer) => {
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

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <div className="flex items-center gap-2">
          <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>Fill in the details to add a new customer to your system.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                  />
                  {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerType">
                    Customer Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    name="customerType"
                    value={formData.customerType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, customerType: value }))}
                  >
                    <SelectTrigger id="customerType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                      <SelectItem value="Educational">Educational</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.customerType && <p className="text-sm text-red-500">{formErrors.customerType}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email"
                    placeholder="Enter email address"
                  />
                  {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                  {formErrors.contact && <p className="text-sm text-red-500">{formErrors.contact}</p>}
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter address"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="gstin">GSTIN (for Business)</Label>
                  <Input
                    id="gstin"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleInputChange}
                    placeholder="Enter GSTIN if applicable"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCustomerOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Adding...
                    </>
                  ) : (
                    "Add Customer"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue={currentTab} className="space-y-4" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All Customers</TabsTrigger>
          <TabsTrigger value="Corporate">Corporate</TabsTrigger>
          <TabsTrigger value="Individual">Individual</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCustomers}</div>
                <p className="text-xs text-muted-foreground">All registered customers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Individual Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customers.filter((c) => c.customerType === "Individual").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {customers.length > 0
                    ? `${Math.round((customers.filter((c) => c.customerType === "Individual").length / customers.length) * 100)}% of total`
                    : "0% of total"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Corporate Customers</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customers.filter((c) => c.customerType === "Corporate").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {customers.length > 0
                    ? `${Math.round((customers.filter((c) => c.customerType === "Corporate").length / customers.length) * 100)}% of total`
                    : "0% of total"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recently Added</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    customers.filter((c) => {
                      const date = new Date(c.createdAt)
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
                      placeholder="Search customers..."
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
                      <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setTypeFilter("all")}>All Types</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTypeFilter("Corporate")}>Corporate</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTypeFilter("Individual")}>Individual</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTypeFilter("Government")}>Government</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTypeFilter("Educational")}>Educational</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTypeFilter("Other")}>Other</DropdownMenuItem>
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
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("name")}>
                        <div className="flex items-center">Customer {renderSortIcon("name")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("customerType")}>
                        <div className="flex items-center">Type {renderSortIcon("customerType")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("email")}>
                        <div className="flex items-center">Email {renderSortIcon("email")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("contact")}>
                        <div className="flex items-center">Phone {renderSortIcon("contact")}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("createdAt")}>
                        <div className="flex items-center">Created {renderSortIcon("createdAt")}</div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No customers found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => (
                        <TableRow key={customer._id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{customer.customerType}</Badge>
                          </TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.contact}</TableCell>
                          <TableCell>{formatDate(customer.createdAt)}</TableCell>
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
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCustomer(customer)
                                    setIsViewDialogOpen(true)
                                  }}
                                >
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCustomerId(customer._id)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  Edit customer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    router.push(`/invoices`)
                                  }}
                                >
                                  Create invoice
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setCustomerToDelete(customer._id)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                >
                                  Delete customer
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <DataTablePagination
                    totalItems={totalCustomers}
                    pageSize={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Corporate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Corporate Customers</CardTitle>
              <CardDescription>Customers registered as businesses with GSTIN</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>GSTIN</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No corporate customers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers
                      .filter((customer) => customer.customerType === "Corporate")
                      .map((customer) => (
                        <TableRow key={customer._id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.gstin || "N/A"}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.contact}</TableCell>
                          <TableCell>{formatDate(customer.createdAt)}</TableCell>
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
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCustomer(customer)
                                    setIsViewDialogOpen(true)
                                  }}
                                >
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCustomerId(customer._id)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  Edit customer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    router.push(`/invoices`)
                                  }}
                                >
                                  Create invoice
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>

              {/* Corporate Pagination */}
              {totalCorporatePages > 1 && (
                <div className="mt-4">
                  <DataTablePagination
                    totalItems={totalCorporate}
                    pageSize={itemsPerPage}
                    currentPage={corporatePage}
                    onPageChange={handleCorporatePageChange}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Customers</CardTitle>
              <CardDescription>Customers registered as individuals</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No individual customers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers
                      .filter((customer) => customer.customerType === "Individual")
                      .map((customer) => (
                        <TableRow key={customer._id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.contact}</TableCell>
                          <TableCell>{customer.address || "N/A"}</TableCell>
                          <TableCell>{formatDate(customer.createdAt)}</TableCell>
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
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCustomer(customer)
                                    setIsViewDialogOpen(true)
                                  }}
                                >
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCustomerId(customer._id)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  Edit customer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    router.push(`/invoices`)
                                  }}
                                >
                                  Create invoice
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>

              {/* Individual Pagination */}
              {totalIndividualPages > 1 && (
                <div className="mt-4">
                  <DataTablePagination
                    totalItems={totalIndividual}
                    pageSize={itemsPerPage}
                    currentPage={individualPage}
                    onPageChange={handleIndividualPageChange}
                  />
                </div>
              )}
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
              This action cannot be undone. This will permanently delete the customer and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Dialog */}
      <ExportDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen} />

      {/* View Details Dialog */}
      <ViewDetailsDialog customer={selectedCustomer} open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} />

      {/* Edit Customer Dialog */}
      <EditCustomerDialog
        customerId={selectedCustomerId}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onCustomerUpdated={fetchCustomers}
      />
    </div>
  )
}
