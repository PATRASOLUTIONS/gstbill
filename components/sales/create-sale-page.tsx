"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Trash2, UserPlus, ArrowLeft } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatCurrency } from "@/utils/format-currency"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

// Define a walk-in customer
const WALKIN_CUSTOMER_ID = "walkin"
const WALKIN_CUSTOMER = {
  _id: WALKIN_CUSTOMER_ID,
  name: "WALKIN CUSTOMER",
  email: "walkin@example.com",
  contact: "0000000000",
}

export function CreateSalePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productSearchOpen, setProductSearchOpen] = useState<number[]>([])
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false)
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false)

  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    contact: "",
    customerType: "Individual",
    address: "",
  })

  // Form state
  const [formData, setFormData] = useState({
    customer: "",
    customerName: "", // Added to store customer name for the API
    customerData: null as any, // To store the full customer data
    saleDate: new Date().toISOString().split("T")[0],
    items: [
      {
        product: "",
        productName: "",
        quantity: 1,
        price: 0,
        taxRate: 0,
        taxAmount: 0,
        total: 0,
      },
    ],
    subtotal: 0,
    taxTotal: 0,
    discountType: "percentage", // "percentage" or "amount"
    discountValue: 0,
    discountAmount: 0,
    roundOff: 0,
    total: 0,
    status: "Pending",
    paymentStatus: "Unpaid",
    notes: "",
  })

  // Form errors
  const [formErrors, setFormErrors] = useState({
    customer: "",
    items: [{ product: "", quantity: "" }],
  })

  // New customer form errors
  const [newCustomerErrors, setNewCustomerErrors] = useState({
    name: "",
    email: "",
    contact: "",
  })

  // Filtered customers based on search query
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      customer.contact.includes(customerSearchQuery),
  )

  // Fetch customers and products when component mounts
  useEffect(() => {
    fetchCustomers()
    fetchProducts()
    resetForm()
  }, [])

  // Reset form
  const resetForm = () => {
    setFormData({
      customer: "",
      customerName: "",
      customerData: null,
      saleDate: new Date().toISOString().split("T")[0],
      items: [
        {
          product: "",
          productName: "",
          quantity: 1,
          price: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 0,
        },
      ],
      subtotal: 0,
      taxTotal: 0,
      discountType: "percentage",
      discountValue: 0,
      discountAmount: 0,
      roundOff: 0,
      total: 0,
      status: "Pending",
      paymentStatus: "Unpaid",
      notes: "",
    })
    setFormErrors({
      customer: "",
      items: [{ product: "", quantity: "" }],
    })
    setCustomerSearchQuery("")
  }

  // Reset new customer form
  const resetNewCustomerForm = () => {
    setNewCustomer({
      name: "",
      email: "",
      contact: "",
      customerType: "Individual",
      address: "",
    })
    setNewCustomerErrors({
      name: "",
      email: "",
      contact: "",
    })
  }

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      if (!response.ok) {
        throw new Error("Failed to fetch customers")
      }
      const data = await response.json()
      // Add walk-in customer at the beginning
      setCustomers([WALKIN_CUSTOMER, ...(data.customers || [])])
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch products from API
  const fetchProducts = async () => {
    try {
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

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user types
    if (name === "customer" && formErrors.customer) {
      setFormErrors((prev) => ({
        ...prev,
        customer: "",
      }))
    }
  }

  // Handle new customer input changes
  const handleNewCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewCustomer((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user types
    if (newCustomerErrors[name as keyof typeof newCustomerErrors]) {
      setNewCustomerErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    const selectedCustomer = customers.find((c) => c._id === customerId)
    if (selectedCustomer) {
      setFormData((prev) => ({
        ...prev,
        customer: customerId,
        customerName: selectedCustomer.name,
        customerData: selectedCustomer,
      }))

      // Close the customer popover
      setIsCustomerPopoverOpen(false)
    }
  }

  // Handle product selection
  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = products.find((p) => p._id === productId)

    if (!selectedProduct) return

    // Get the selling price (use price if sellingPrice is not available)
    const sellingPrice = selectedProduct.sellingPrice || selectedProduct.price
    const taxRate = selectedProduct.tax || 0
    const quantity = 1

    // Calculate pre-tax price (price without tax)
    const preTaxPrice = sellingPrice / (1 + taxRate / 100)

    // Calculate tax amount based on pre-tax price
    const taxAmount = preTaxPrice * quantity * (taxRate / 100)

    // Total is pre-tax price + tax
    const total = preTaxPrice * quantity + taxAmount

    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      product: productId,
      productName: selectedProduct.name,
      price: preTaxPrice,
      quantity: quantity,
      taxRate: taxRate,
      taxAmount: taxAmount,
      total: total,
    }

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }))

    // Clear error
    const updatedErrors = [...formErrors.items]
    updatedErrors[index] = { ...updatedErrors[index], product: "" }
    setFormErrors((prev) => ({
      ...prev,
      items: updatedErrors,
    }))

    // Close the product search popover
    setProductSearchOpen((prev) => {
      const newState = [...prev]
      newState[index] = 0
      return newState
    })

    // Recalculate totals
    calculateTotals(updatedItems)
  }

  // Handle quantity change
  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) return

    const updatedItems = [...formData.items]
    const item = updatedItems[index]

    // Update quantity and recalculate
    item.quantity = quantity

    // Tax amount is based on the pre-tax price
    item.taxAmount = item.price * quantity * (item.taxRate / 100)

    // Total is pre-tax price + tax
    item.total = item.price * quantity + item.taxAmount

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }))

    // Clear error
    const updatedErrors = [...formErrors.items]
    updatedErrors[index] = { ...updatedErrors[index], quantity: "" }
    setFormErrors((prev) => ({
      ...prev,
      items: updatedErrors,
    }))

    // Recalculate totals
    calculateTotals(updatedItems)
  }

  // Handle price change
  const handlePriceChange = (index: number, price: number) => {
    const updatedItems = [...formData.items]
    const item = updatedItems[index]

    // Update pre-tax price
    item.price = price

    // Calculate tax amount based on the pre-tax price
    item.taxAmount = price * item.quantity * (item.taxRate / 100)

    // Total is pre-tax price + tax
    item.total = price * item.quantity + item.taxAmount

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }))

    // Recalculate totals
    calculateTotals(updatedItems)
  }

  // Add a new function to handle total changes
  const handleTotalChange = (index: number, total: number) => {
    const updatedItems = [...formData.items]
    const item = updatedItems[index]

    // Update the total
    item.total = total

    // Recalculate the price based on the new total
    // This is a simplified approach - in a real system you might want more complex logic
    const preTaxTotal = total / (1 + item.taxRate / 100)
    item.price = preTaxTotal / item.quantity
    item.taxAmount = total - preTaxTotal

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }))

    // Recalculate totals
    calculateTotals(updatedItems)
  }

  // Calculate totals
  const calculateTotals = (items: SaleItem[]) => {
    // Subtotal is the sum of all pre-tax prices * quantities
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // Tax total is the sum of all tax amounts
    const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0)

    // Calculate discount amount based on type and value
    let discountAmount = 0
    if (formData.discountType === "percentage") {
      discountAmount = (subtotal * formData.discountValue) / 100
    } else {
      discountAmount = formData.discountValue
    }

    // Calculate total before rounding
    const totalBeforeRounding = subtotal + taxTotal - discountAmount

    // Apply rounding
    const roundOff = applyRounding(totalBeforeRounding)

    // Final total with rounding
    const total = totalBeforeRounding + roundOff

    setFormData((prev) => ({
      ...prev,
      subtotal,
      taxTotal,
      discountAmount,
      roundOff,
      total,
    }))
  }

  // Add new item
  const addNewItem = () => {
    const newItem = {
      product: "",
      productName: "",
      quantity: 1,
      price: 0,
      taxRate: 0,
      taxAmount: 0,
      total: 0,
    }

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }))

    // Add error field for new item
    setFormErrors((prev) => ({
      ...prev,
      items: [...prev.items, { product: "", quantity: "" }],
    }))
  }

  // Remove item
  const removeItem = (index: number) => {
    if (formData.items.length <= 1) {
      toast({
        title: "Error",
        description: "At least one item is required",
        variant: "destructive",
      })
      return
    }

    const updatedItems = formData.items.filter((_, i) => i !== index)
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }))

    // Remove error field
    const updatedErrors = formErrors.items.filter((_, i) => i !== index)
    setFormErrors((prev) => ({
      ...prev,
      items: updatedErrors,
    }))

    // Recalculate totals
    calculateTotals(updatedItems)
  }

  // Validate form
  const validateForm = () => {
    const errors = {
      customer: "",
      items: formData.items.map(() => ({ product: "", quantity: "" })),
    }

    let isValid = true

    if (!formData.customer) {
      errors.customer = "Customer is required"
      isValid = false
    }

    formData.items.forEach((item, index) => {
      if (!item.product) {
        errors.items[index].product = "Product is required"
        isValid = false
      }

      if (!item.quantity || item.quantity < 1) {
        errors.items[index].quantity = "Quantity must be at least 1"
        isValid = false
      }

      if (!item.price || item.price <= 0) {
        // Add validation for price
        errors.items[index].quantity = "Price must be greater than 0"
        isValid = false
      }
    })

    setFormErrors(errors)

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
    }

    return isValid
  }

  // Validate new customer form
  const validateNewCustomerForm = () => {
    const errors = {
      name: "",
      email: "",
      contact: "",
    }

    let isValid = true

    if (!newCustomer.name) {
      errors.name = "Name is required"
      isValid = false
    }

    if (!newCustomer.email) {
      errors.email = "Email is required"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(newCustomer.email)) {
      errors.email = "Email is invalid"
      isValid = false
    }

    if (!newCustomer.contact) {
      errors.contact = "Contact is required"
      isValid = false
    }

    setNewCustomerErrors(errors)

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
    }

    return isValid
  }

  // Find the handleSubmit function and replace it with this updated version that generates an invoice after creating a sale

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      // Get the selected customer name
      const selectedCustomer = customers.find((c) => c._id === formData.customer)

      // Prepare data for submission
      const submissionData = {
        ...formData,
        customerName: selectedCustomer?.name || "Unknown Customer",
        // If using walk-in customer, send the full customer data
        customerData: formData.customer === WALKIN_CUSTOMER_ID ? WALKIN_CUSTOMER : undefined,
      }

      console.log("Creating sale with data:", submissionData)

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Sale creation failed with status:", response.status, errorData)
        throw new Error(errorData.error || errorData.message || `Failed to create sale (${response.status})`)
      }

      const data = await response.json()
      console.log("Sale created successfully:", data)

      toast({
        title: "Success",
        description: `Sale created successfully with Order ID: ${data.orderId || "Generated"}`,
      })

      // Generate invoice for the sale
      try {
        toast({
          title: "Creating Invoice",
          description: "Please wait while we generate the invoice...",
        })

        const invoiceResponse = await fetch(`/api/invoice/from-sale`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ saleId: data._id }),
        })

        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json()
          toast({
            title: "Invoice Generated",
            description: `Invoice ${invoiceData.invoiceNumber} created successfully`,
          })
        } else {
          console.error("Failed to generate invoice, but sale was created successfully")
          const errorData = await invoiceResponse.json().catch(() => ({}))
          console.error("Invoice error details:", errorData)
        }
      } catch (invoiceError) {
        console.error("Error generating invoice:", invoiceError)
        // We don't throw here because the sale was created successfully
        toast({
          title: "Note",
          description: "Sale created, but invoice generation failed. You can create it manually later.",
          variant: "default",
        })
      }

      // Navigate back to sales page
      router.push("/sales")
    } catch (error) {
      console.error("Error creating sale:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create sale. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle new customer submission
  const handleCreateNewCustomer = async () => {
    if (!validateNewCustomerForm()) return

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCustomer),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to create customer")
      }

      const data = await response.json()

      // Add the new customer to the list and select it
      setCustomers((prev) => [WALKIN_CUSTOMER, data, ...prev.filter((c) => c._id !== WALKIN_CUSTOMER_ID)])

      // Select the new customer
      setFormData((prev) => ({
        ...prev,
        customer: data._id,
        customerName: data.name,
        customerData: data,
      }))

      // Close the new customer dialog
      setIsNewCustomerDialogOpen(false)

      // Reset the new customer form
      resetNewCustomerForm()

      toast({
        title: "Success",
        description: "Customer created successfully",
      })
    } catch (error) {
      console.error("Error creating customer:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create customer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle discount type change
  const handleDiscountTypeChange = (type: string) => {
    setFormData((prev) => {
      const newState = { ...prev, discountType: type }
      // Recalculate discount amount based on new type
      if (type === "percentage") {
        newState.discountAmount = (prev.subtotal * prev.discountValue) / 100
      } else {
        newState.discountAmount = prev.discountValue
      }

      // Recalculate total with new discount
      const totalBeforeRounding = prev.subtotal + prev.taxTotal - newState.discountAmount

      // Apply rounding
      const roundOff = applyRounding(totalBeforeRounding)
      newState.roundOff = roundOff
      newState.total = totalBeforeRounding + roundOff

      return newState
    })
  }

  // Handle discount value change
  const handleDiscountValueChange = (value: number) => {
    setFormData((prev) => {
      const newState = { ...prev, discountValue: value }

      // Calculate discount amount based on type
      if (prev.discountType === "percentage") {
        newState.discountAmount = (prev.subtotal * value) / 100
      } else {
        newState.discountAmount = value
      }

      // Recalculate total with new discount
      const totalBeforeRounding = prev.subtotal + prev.taxTotal - newState.discountAmount

      // Apply rounding
      const roundOff = applyRounding(totalBeforeRounding)
      newState.roundOff = roundOff
      newState.total = totalBeforeRounding + roundOff

      return newState
    })
  }

  // Apply rounding logic
  const applyRounding = (value: number) => {
    const decimalPart = value - Math.floor(value)

    if (decimalPart === 0) return 0

    if (decimalPart < 0.5) {
      return -decimalPart // Round down to nearest whole number
    } else {
      return 1 - decimalPart // Round up to nearest whole number
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/sales")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sales
        </Button>
      </div>

      <div className="grid gap-4">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                  <CardDescription>Select a customer or create a new one</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="customer">
                      Customer <span className="text-red-500">*</span>
                    </Label>
                    <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {formData.customer
                            ? customers.find((customer) => customer._id === formData.customer)?.name ||
                              "Select customer"
                            : "Select customer"}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search customers..."
                            value={customerSearchQuery}
                            onValueChange={setCustomerSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup>
                              {/* Add New Customer option */}
                              <CommandItem
                                onSelect={() => {
                                  setIsNewCustomerDialogOpen(true)
                                  setIsCustomerPopoverOpen(false)
                                }}
                                className="text-primary"
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                <span>+ New Customer</span>
                              </CommandItem>

                              {/* List of customers */}
                              {filteredCustomers.map((customer) => (
                                <CommandItem
                                  key={customer._id}
                                  value={customer.name}
                                  onSelect={() => handleCustomerSelect(customer._id)}
                                >
                                  <span>{customer.name}</span>
                                  {customer._id !== WALKIN_CUSTOMER_ID && (
                                    <span className="ml-auto text-xs text-muted-foreground">{customer.contact}</span>
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {formErrors.customer && <p className="text-sm text-red-500">{formErrors.customer}</p>}
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label htmlFor="saleDate">Sale Date</Label>
                    <Input
                      id="saleDate"
                      name="saleDate"
                      type="date"
                      value={formData.saleDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
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
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentStatus">Payment Status</Label>
                      <Select
                        name="paymentStatus"
                        value={formData.paymentStatus}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentStatus: value }))}
                      >
                        <SelectTrigger id="paymentStatus">
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unpaid">Unpaid</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Add any additional notes here"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>Review your order details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal:</span>
                      <span>{formatCurrency(formData.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tax:</span>
                      <span>{formatCurrency(formData.taxTotal)}</span>
                    </div>

                    {/* Discount section */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Discount:</span>
                      <div className="flex items-center gap-2">
                        <Select value={formData.discountType} onValueChange={handleDiscountTypeChange}>
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="amount">Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="0"
                          step={formData.discountType === "percentage" ? "1" : "0.01"}
                          value={formData.discountValue}
                          onChange={(e) => handleDiscountValueChange(Number(e.target.value))}
                          className="w-[100px]"
                        />
                        <span>{formatCurrency(formData.discountAmount)}</span>
                      </div>
                    </div>

                    {/* Round off */}
                    <div className="flex justify-between">
                      <span className="font-medium">Round Off:</span>
                      <span>{formatCurrency(formData.roundOff)}</span>
                    </div>

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(formData.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>Add products to this sale</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addNewItem}>
                    <Plus className="h-4 w-4 mr-2" /> Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end border p-2 rounded-md">
                      <div className="col-span-4 space-y-1">
                        <Label htmlFor={`product-${index}`}>
                          Product <span className="text-red-500">*</span>
                        </Label>
                        <Popover
                          open={productSearchOpen[index] === 1}
                          onOpenChange={(open) => {
                            setProductSearchOpen((prev) => {
                              const newState = [...prev]
                              newState[index] = open ? 1 : 0
                              return newState
                            })
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={productSearchOpen[index] === 1}
                              className="w-full justify-between"
                            >
                              {item.product
                                ? products.find((product) => product._id === item.product)?.name
                                : "Select product..."}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput placeholder="Search products..." />
                              <CommandEmpty>No product found.</CommandEmpty>
                              <CommandList>
                                <CommandGroup>
                                  {products.map((product) => (
                                    <CommandItem
                                      key={product._id}
                                      value={product.name}
                                      onSelect={() => {
                                        handleProductSelect(index, product._id)
                                      }}
                                    >
                                      <span>{product.name}</span>
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        {formatCurrency(product.sellingPrice || product.price)} | Stock: {product.stock}
                                      </span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {formErrors.items[index]?.product && (
                          <p className="text-xs text-red-500">{formErrors.items[index].product}</p>
                        )}
                      </div>

                      <div className="col-span-1 space-y-1">
                        <Label htmlFor={`quantity-${index}`}>
                          Qty <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, Number.parseInt(e.target.value))}
                        />
                        {formErrors.items[index]?.quantity && (
                          <p className="text-xs text-red-500">{formErrors.items[index].quantity}</p>
                        )}
                      </div>

                      <div className="col-span-2 space-y-1">
                        <Label htmlFor={`price-${index}`}>Price</Label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price.toFixed(2)}
                          onChange={(e) => handlePriceChange(index, Number.parseFloat(e.target.value))}
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <Label htmlFor={`tax-${index}`}>Tax Rate (%)</Label>
                        <Input
                          id={`tax-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.taxRate}
                          readOnly
                          className="bg-muted"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <Label htmlFor={`total-${index}`}>Total</Label>
                        <Input
                          id={`total-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.total.toFixed(2)}
                          onChange={(e) => handleTotalChange(index, Number.parseFloat(e.target.value))}
                          className="bg-white"
                        />
                      </div>

                      <div className="col-span-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.push("/sales")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Sale"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>

      {/* New Customer Dialog */}
      <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Enter customer details to create a new customer record.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={newCustomer.name}
                onChange={handleNewCustomerInputChange}
                placeholder="Customer name"
              />
              {newCustomerErrors.name && <p className="text-sm text-red-500">{newCustomerErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newCustomer.email}
                onChange={handleNewCustomerInputChange}
                placeholder="customer@example.com"
              />
              {newCustomerErrors.email && <p className="text-sm text-red-500">{newCustomerErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">
                Contact <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact"
                name="contact"
                value={newCustomer.contact}
                onChange={handleNewCustomerInputChange}
                placeholder="Phone number"
              />
              {newCustomerErrors.contact && <p className="text-sm text-red-500">{newCustomerErrors.contact}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerType">Customer Type</Label>
              <Select
                name="customerType"
                value={newCustomer.customerType}
                onValueChange={(value) => setNewCustomer((prev) => ({ ...prev, customerType: value }))}
              >
                <SelectTrigger id="customerType">
                  <SelectValue placeholder="Select customer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Educational">Educational</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={newCustomer.address}
                onChange={handleNewCustomerInputChange}
                placeholder="Customer address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCustomerDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewCustomer}
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                "Create Customer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
