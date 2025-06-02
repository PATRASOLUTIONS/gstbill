"use client"

import { SuppliersTable } from "@/components/suppliers/suppliers-table"
import { CreateSupplierDialog } from "@/components/suppliers/create-supplier-dialog"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowUpDown, ArrowDown, ArrowUp, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"

// Interface for a supplier
interface Supplier {
  _id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstin?: string
  category?: string
  status: "Active" | "Inactive" | "On Hold"
  paymentTerms?: string
  creditLimit?: number
  outstandingBalance?: number
  lastOrderDate?: string | null
  createdAt?: string
}

// Interface for a category
interface Category {
  _id: string
  name: string
  description?: string
  type: string
}

export default function SuppliersClientPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isViewSupplierOpen, setIsViewSupplierOpen] = useState(false)
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Supplier
    direction: "ascending" | "descending"
  } | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [totalSuppliers, setTotalSuppliers] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTabValue, setActiveTabValue] = useState("all")

  // Add state for filtered suppliers by status
  const [activeSuppliers, setActiveSuppliers] = useState<Supplier[]>([])
  const [inactiveSuppliers, setInactiveSuppliers] = useState<Supplier[]>([])
  const [onHoldSuppliers, setOnHoldSuppliers] = useState<Supplier[]>([])

  // Add pagination state for each tab
  const [activePage, setActivePage] = useState(1)
  const [inactivePage, setInactivePage] = useState(1)
  const [onHoldPage, setOnHoldPage] = useState(1)

  // Add total counts for each status
  const [totalActiveSuppliers, setTotalActiveSuppliers] = useState(0)
  const [totalInactiveSuppliers, setTotalInactiveSuppliers] = useState(0)
  const [totalOnHoldSuppliers, setTotalOnHoldSuppliers] = useState(0)

  // Custom badge styles
  const statusBadgeStyles = {
    Active: "bg-green-100 text-green-800 hover:bg-green-100",
    Inactive: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    "On Hold": "bg-amber-100 text-amber-800 hover:bg-amber-100",
  }

  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get current page from URL or default to 1
  const currentPage = Number(searchParams.get("page") || "1")
  const itemsPerPage = 10 // Fixed to 10 items per page as requested

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    category: "",
    paymentTerms: "",
    creditLimit: 0,
    status: "Active" as "Active" | "Inactive" | "On Hold",
  })
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    type: "supplier",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: id === "creditLimit" ? Number(value) : value,
    }))

    // Clear error when user types
    if (formErrors[id]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[id]
        return newErrors
      })
    }
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))

    // Clear error when user selects
    if (formErrors[id]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[id]
        return newErrors
      })
    }
  }

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setCategoryFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  // Update the validateForm function to include validation for phone number and contact person
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) errors.name = "Supplier name is required"

    // Contact Person validation - only letters allowed
    if (!formData.contactPerson.trim()) {
      errors.contactPerson = "Contact person is required"
    } else if (!/^[A-Za-z\s]+$/.test(formData.contactPerson)) {
      errors.contactPerson = "Contact person should contain only letters"
    }

    if (!formData.email.trim()) errors.email = "Email is required"
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = "Invalid email format"

    // Phone validation - exactly 10 digits
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required"
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.phone = "Phone number must be exactly 10 digits"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateCategoryForm = () => {
    if (!categoryFormData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create supplier")
      }

      // Success
      toast({
        title: "Success",
        description: "Supplier added successfully",
        variant: "default",
      })

      // Reset form and close dialog
      setFormData({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        gstin: "",
        category: "",
        paymentTerms: "",
        creditLimit: 0,
        status: "Active",
      })

      setIsAddSupplierOpen(false)

      // Refresh the suppliers list
      fetchSuppliers()
      fetchSuppliersByStatus()
    } catch (error) {
      console.error("Error creating supplier:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add supplier",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSubmit = async () => {
    if (!validateForm() || !selectedSupplier) return

    try {
      setIsSubmitting(true)

      // Check if we have a valid ID
      if (!selectedSupplier._id) {
        throw new Error("Supplier ID is missing")
      }

      console.log("Updating supplier with ID:", selectedSupplier._id)
      console.log("Update data:", formData)

      // Use PATCH method for the update
      const response = await fetch(`/api/suppliers?id=${selectedSupplier._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update supplier")
      }

      const data = await response.json()
      console.log("Update response:", data)

      // Success
      toast({
        title: "Success",
        description: "Supplier updated successfully",
        variant: "default",
      })

      // Update the supplier in the local state
      setSuppliers(suppliers.map((s) => (s._id === selectedSupplier._id ? { ...s, ...formData } : s)))

      // Close dialog
      setIsEditSupplierOpen(false)

      // Refresh the suppliers list to get the latest data
      fetchSuppliers()
      fetchSuppliersByStatus()
    } catch (error) {
      console.error("Error updating supplier:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update supplier",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddCategory = async () => {
    if (!validateCategoryForm()) return

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryFormData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create category")
      }

      const data = await response.json()

      // Success
      toast({
        title: "Success",
        description: "Category added successfully",
        variant: "default",
      })

      // Add the new category to the list
      setCategories([...categories, data.category])

      // Reset form and close dialog
      setCategoryFormData({
        name: "",
        description: "",
        type: "supplier",
      })

      setIsAddCategoryOpen(false)
    } catch (error) {
      console.error("Error creating category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add category",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (status: "Active" | "Inactive" | "On Hold") => {
    if (!selectedSupplier) return

    try {
      setIsSubmitting(true)

      // Check if we have a valid ID
      if (!selectedSupplier._id) {
        throw new Error("Supplier ID is missing")
      }

      // Use PATCH method for status update
      const response = await fetch(`/api/suppliers?id=${selectedSupplier._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update supplier status")
      }

      const data = await response.json()
      console.log("Status update response:", data)

      // Success
      toast({
        title: "Success",
        description: `Supplier status updated to ${status}`,
        variant: "default",
      })

      // Update the supplier in the local state
      setSuppliers(suppliers.map((s) => (s._id === selectedSupplier._id ? { ...s, status } : s)))

      // Close dialog
      setIsStatusDialogOpen(false)

      // Refresh the suppliers list
      fetchSuppliers()
      fetchSuppliersByStatus()
    } catch (error) {
      console.error("Error updating supplier status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update supplier status",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return

    try {
      setIsSubmitting(true)

      // Check if we have a valid ID
      if (!selectedSupplier._id) {
        throw new Error("Supplier ID is missing")
      }

      console.log("Deleting supplier with ID:", selectedSupplier._id)

      const response = await fetch(`/api/suppliers?id=${selectedSupplier._id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete supplier")
      }

      const data = await response.json()
      console.log("Delete response:", data)

      // Success
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
        variant: "default",
      })

      // Remove the supplier from the local state
      setSuppliers(suppliers.filter((s) => s._id !== selectedSupplier._id))

      // Close dialog
      setIsDeleteDialogOpen(false)

      // Refresh the suppliers list
      fetchSuppliers()
      fetchSuppliersByStatus()
    } catch (error) {
      console.error("Error deleting supplier:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete supplier",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update the handleExportCsv function to use our new dialog
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  const handleExportCsv = () => {
    setIsExportDialogOpen(true)
  }

  // Update the fetchSuppliers function to properly handle pagination
  const fetchSuppliers = async () => {
    try {
      setLoading(true)

      // Build the query parameters
      let queryParams = `page=${currentPage}&limit=${itemsPerPage}`

      // Add any active filters
      if (searchTerm) {
        queryParams += `&search=${encodeURIComponent(searchTerm)}`
      }

      if (categoryFilter !== "all") {
        queryParams += `&category=${encodeURIComponent(categoryFilter)}`
      }

      if (statusFilter !== "all") {
        queryParams += `&status=${encodeURIComponent(statusFilter)}`
      }

      // Add sorting if active
      if (sortConfig) {
        queryParams += `&sort=${sortConfig.key}&order=${sortConfig.direction === "ascending" ? "asc" : "desc"}`
      }

      const response = await fetch(`/api/suppliers?${queryParams}`)

      if (!response.ok) {
        throw new Error("Failed to fetch suppliers")
      }

      const data = await response.json()
      console.log("Fetched suppliers:", data)
      setSuppliers(data.suppliers || [])
      setTotalSuppliers(data.pagination?.total || 0)
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch suppliers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add a new function to fetch suppliers by status
  const fetchSuppliersByStatus = async () => {
    if (!session) return

    try {
      // Fetch Active suppliers
      const activeResponse = await fetch(`/api/suppliers?status=Active&page=${activePage}&limit=${itemsPerPage}`)
      if (activeResponse.ok) {
        const activeData = await activeResponse.json()
        setActiveSuppliers(activeData.suppliers || [])
        setTotalActiveSuppliers(activeData.pagination?.total || 0)
      }

      // Fetch Inactive suppliers
      const inactiveResponse = await fetch(`/api/suppliers?status=Inactive&page=${inactivePage}&limit=${itemsPerPage}`)
      if (inactiveResponse.ok) {
        const inactiveData = await inactiveResponse.json()
        setInactiveSuppliers(inactiveData.suppliers || [])
        setTotalInactiveSuppliers(inactiveData.pagination?.total || 0)
      }

      // Fetch On Hold suppliers
      const onHoldResponse = await fetch(`/api/suppliers?status=On Hold&page=${onHoldPage}&limit=${itemsPerPage}`)
      if (onHoldResponse.ok) {
        const onHoldData = await onHoldResponse.json()
        setOnHoldSuppliers(onHoldData.suppliers || [])
        setTotalOnHoldSuppliers(onHoldData.pagination?.total || 0)
      }
    } catch (error) {
      console.error("Error fetching suppliers by status:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?type=supplier")

      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }

      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  // Update useEffect to depend on more variables
  useEffect(() => {
    if (session) {
      fetchSuppliers()
      fetchCategories()
    }
  }, [session, currentPage, itemsPerPage, searchTerm, categoryFilter, statusFilter, sortConfig])

  // Add a new useEffect for fetching suppliers by status
  useEffect(() => {
    if (session) {
      fetchSuppliersByStatus()
    }
  }, [session, activePage, inactivePage, onHoldPage])

  // Get unique categories for filter
  const uniqueCategories = [...new Set(suppliers.map((supplier) => supplier.category).filter(Boolean))]

  // Sort function
  const requestSort = (key: keyof Supplier) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Apply sorting, filtering and search
  const filteredAndSortedSuppliers = () => {
    let filteredSuppliers = [...suppliers]

    // Apply category filter
    if (categoryFilter !== "all") {
      filteredSuppliers = filteredSuppliers.filter((supplier) => supplier.category === categoryFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filteredSuppliers = filteredSuppliers.filter((supplier) => supplier.status === statusFilter)
    }

    // Apply search
    if (searchTerm) {
      filteredSuppliers = filteredSuppliers.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (supplier.gstin && supplier.gstin.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply sorting
    if (sortConfig !== null) {
      filteredSuppliers.sort((a, b) => {
        const aValue = a[sortConfig.key] || ""
        const bValue = b[sortConfig.key] || ""

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    return filteredSuppliers
  }

  // Handle page change for main tab
  const handlePageChange = (page: number) => {
    router.push(`/suppliers?page=${page}`)
  }

  // Handle page change for status tabs
  const handleActivePageChange = (page: number) => {
    setActivePage(page)
  }

  const handleInactivePageChange = (page: number) => {
    setInactivePage(page)
  }

  const handleOnHoldPageChange = (page: number) => {
    setOnHoldPage(page)
  }

  // Status badge variant helper
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "success"
      case "Inactive":
        return "secondary"
      case "On Hold":
        return "warning"
      default:
        return "default"
    }
  }

  // Status icon helper
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "Inactive":
        return <XCircle className="h-5 w-5 text-gray-500" />
      case "On Hold":
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      default:
        return null
    }
  }

  // View supplier details
  const viewSupplierDetails = (supplier: Supplier) => {
    console.log("Viewing supplier details:", supplier)
    setSelectedSupplier(supplier)
    setIsViewSupplierOpen(true)
  }

  // Edit supplier
  const editSupplier = (supplier: Supplier) => {
    console.log("Editing supplier:", supplier)
    setSelectedSupplier(supplier)
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      pincode: supplier.pincode || "",
      gstin: supplier.gstin || "",
      category: supplier.category || "",
      paymentTerms: supplier.paymentTerms || "",
      creditLimit: supplier.creditLimit || 0,
      status: supplier.status,
    })
    setIsEditSupplierOpen(true)
  }

  // Change supplier status
  const changeSupplierStatus = (supplier: Supplier) => {
    console.log("Changing supplier status:", supplier)
    setSelectedSupplier(supplier)
    setIsStatusDialogOpen(true)
  }

  // Confirm delete supplier
  const confirmDeleteSupplier = (supplier: Supplier) => {
    console.log("Confirming delete for supplier:", supplier)
    setSelectedSupplier(supplier)
    setIsDeleteDialogOpen(true)
  }

  // Render loading state
  if (loading && suppliers.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Helper to render sort indicator
  const renderSortIcon = (key: keyof Supplier) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTabValue(value)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <PageHeader heading="Suppliers" subheading="Manage your suppliers and their details" />
        <CreateSupplierDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </CreateSupplierDialog>
      </div>
      <SuppliersTable />
    </div>
  )
}
