"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CalendarIcon, ChevronDown, Plus, Check } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  price: number
  tax: number
  stock: number
}

interface InvoiceItem {
  productId: string
  productName: string
  quantity: number
  price: number
  tax: number
  discount: number
  discountType: "percentage" | "amount"
  total: number
}

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
}

export function CreateInvoiceForm() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    invoiceType: "gst",
    customer: "",
    paymentMethod: "bank",
    invoiceDate: undefined as Date | undefined,
    dueDate: undefined as Date | undefined,
    notes: "",
  })

  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])

  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(1)
  const [discount, setDiscount] = useState<number>(0)
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  // Fetch products, customers, and generate invoice number on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch products
        const productsResponse = await fetch("/api/products")
        if (!productsResponse.ok) throw new Error("Failed to fetch products")
        const productsData = await productsResponse.json()
        setProducts(productsData)

        // Fetch customers
        const customersResponse = await fetch("/api/customers")
        if (!customersResponse.ok) throw new Error("Failed to fetch customers")
        const customersData = await customersResponse.json()
        setCustomers(customersData)

        // Generate invoice number
        const invoiceNumberResponse = await fetch("/api/invoices/generate-number")
        if (!invoiceNumberResponse.ok) throw new Error("Failed to generate invoice number")
        const { invoiceNumber } = await invoiceNumberResponse.json()

        setInvoiceData((prev) => ({
          ...prev,
          invoiceNumber,
          invoiceDate: new Date(),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Default due date: 30 days from now
        }))
      } catch (error) {
        console.error("Error fetching initial data:", error)
        toast({
          title: "Error",
          description: "Failed to load initial data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleChange = (field: string, value: any) => {
    setInvoiceData((prev) => ({ ...prev, [field]: value }))

    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateStep1 = () => {
    const errors: Record<string, string> = {}

    if (!invoiceData.customer) {
      errors.customer = "Please select a customer"
    }

    if (!invoiceData.paymentMethod) {
      errors.paymentMethod = "Please select a payment method"
    }

    if (!invoiceData.invoiceDate) {
      errors.invoiceDate = "Please select an invoice date"
    }

    if (!invoiceData.dueDate) {
      errors.dueDate = "Please select a due date"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddProduct = () => {
    if (!selectedProduct) return

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return

    // Check if product is in stock
    if (product.stock < quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stock} units available for ${product.name}`,
        variant: "destructive",
      })
      return
    }

    // Calculate discount
    const discountValue = discountType === "percentage" ? (product.price * quantity * discount) / 100 : discount

    // Calculate total (without tax)
    const subtotal = product.price * quantity
    const total = subtotal - discountValue

    // Check if product already exists in invoice items
    const existingItemIndex = invoiceItems.findIndex((item) => item.productId === product.id)

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...invoiceItems]
      const existingItem = updatedItems[existingItemIndex]

      const newQuantity = existingItem.quantity + quantity

      // Check if new total quantity exceeds stock
      if (newQuantity > product.stock) {
        toast({
          title: "Insufficient Stock",
          description: `Cannot add ${quantity} more units. Only ${product.stock - existingItem.quantity} units available.`,
          variant: "destructive",
        })
        return
      }

      // Update the item
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        discount: existingItem.discount + discountValue,
        total: existingItem.total + total,
      }

      setInvoiceItems(updatedItems)
    } else {
      // Add new item
      const newItem: InvoiceItem = {
        productId: product.id,
        productName: product.name,
        quantity,
        price: product.price,
        tax: product.tax,
        discount: discountValue,
        discountType,
        total,
      }

      setInvoiceItems((prev) => [...prev, newItem])
    }

    // Reset form
    setSelectedProduct("")
    setQuantity(1)
    setDiscount(0)
    setShowProductDropdown(false)

    toast({
      title: "Product Added",
      description: `${product.name} added to invoice`,
    })
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...invoiceItems]
    newItems.splice(index, 1)
    setInvoiceItems(newItems)

    toast({
      title: "Product Removed",
      description: "Product removed from invoice",
    })
  }

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTotalTax = () => {
    return invoiceItems.reduce((sum, item) => {
      const taxAmount = (item.price * item.quantity * item.tax) / 100
      return sum + taxAmount
    }, 0)
  }

  const calculateTotalDiscount = () => {
    return invoiceItems.reduce((sum, item) => sum + item.discount, 0)
  }

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTotalTax()
    return subtotal + tax
  }

  const nextStep = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const prevStep = () => {
    setStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (invoiceItems.length === 0) {
      toast({
        title: "No Products",
        description: "Please add at least one product to the invoice",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const invoicePayload = {
        ...invoiceData,
        items: invoiceItems,
        subtotal: calculateSubtotal(),
        tax: calculateTotalTax(),
        discount: calculateTotalDiscount(),
        total: calculateGrandTotal(),
        status: "pending",
        createdAt: new Date(),
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoicePayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create invoice")
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: "Invoice created successfully",
      })

      router.push(`/invoices/${result._id}`)
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace("₹", "₹")
  }

  // If still loading initial data, show loading state
  if (isLoading) {
    return (
      <Card className="border rounded-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Step 1: Customer Information */}
      {step === 1 && (
        <Card className="border rounded-lg">
          <CardContent className="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                nextStep()
              }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold mb-6">Customer Information</h2>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="invoiceNumber" className="text-base font-medium">
                    Invoice Number
                  </Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => handleChange("invoiceNumber", e.target.value)}
                    className="mt-2 bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">Invoice Type</Label>
                  <RadioGroup
                    value={invoiceData.invoiceType}
                    onValueChange={(value) => handleChange("invoiceType", value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gst" id="gst" />
                      <Label htmlFor="gst" className="cursor-pointer">
                        GST Invoice
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="non-gst" id="non-gst" />
                      <Label htmlFor="non-gst" className="cursor-pointer">
                        Non-GST Invoice
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="customer" className="text-base font-medium">
                    Customer
                  </Label>
                  <Select value={invoiceData.customer} onValueChange={(value) => handleChange("customer", value)}>
                    <SelectTrigger id="customer" className="w-full mt-2">
                      <SelectValue placeholder={isLoading ? "Loading customers..." : "Select customer"} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.customer && <p className="text-sm text-red-500 mt-1">{formErrors.customer}</p>}
                </div>

                <div>
                  <Label htmlFor="paymentMethod" className="text-base font-medium">
                    Payment Method
                  </Label>
                  <Select
                    value={invoiceData.paymentMethod}
                    onValueChange={(value) => handleChange("paymentMethod", value)}
                  >
                    <SelectTrigger id="paymentMethod" className="w-full mt-2">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.paymentMethod && <p className="text-sm text-red-500 mt-1">{formErrors.paymentMethod}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="invoiceDate" className="text-base font-medium">
                      Invoice Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal mt-2",
                            !invoiceData.invoiceDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invoiceData.invoiceDate ? format(invoiceData.invoiceDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={invoiceData.invoiceDate}
                          onSelect={(date) => handleChange("invoiceDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.invoiceDate && <p className="text-sm text-red-500 mt-1">{formErrors.invoiceDate}</p>}
                  </div>

                  <div>
                    <Label htmlFor="dueDate" className="text-base font-medium">
                      Due Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal mt-2",
                            !invoiceData.dueDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invoiceData.dueDate ? format(invoiceData.dueDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={invoiceData.dueDate}
                          onSelect={(date) => handleChange("dueDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.dueDate && <p className="text-sm text-red-500 mt-1">{formErrors.dueDate}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-base font-medium">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={invoiceData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Enter any additional notes"
                    className="min-h-[100px] mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#0f172a] hover:bg-[#1e293b]">
                  Next
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Products */}
      {step === 2 && (
        <Card className="border rounded-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Products</h2>
              <Button variant="outline" onClick={prevStep} className="border-gray-300">
                Back to Customer Info
              </Button>
            </div>

            <div className="space-y-6">
              {/* Product Selection */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4">
                  <Label htmlFor="product">Product</Label>
                  <div className="relative">
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={showProductDropdown}
                      className="w-full justify-between"
                      onClick={() => setShowProductDropdown(!showProductDropdown)}
                    >
                      {selectedProduct ? products.find((p) => p.id === selectedProduct)?.name : "Select product"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                    {showProductDropdown && (
                      <div className="absolute top-full left-0 z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                        <div className="p-2">
                          <Input
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="mb-2"
                          />
                        </div>
                        <div className="max-h-60 overflow-auto">
                          {filteredProducts.length === 0 ? (
                            <div className="px-3 py-2 text-center text-gray-500">No products found</div>
                          ) : (
                            filteredProducts.map((product) => (
                              <div
                                key={product.id}
                                className={cn(
                                  "px-3 py-2 hover:bg-gray-100 cursor-pointer",
                                  product.stock === 0 && "opacity-50",
                                )}
                                onClick={() => {
                                  if (product.stock > 0) {
                                    setSelectedProduct(product.id)
                                    setShowProductDropdown(false)
                                  } else {
                                    toast({
                                      title: "Out of Stock",
                                      description: `${product.name} is currently out of stock`,
                                      variant: "destructive",
                                    })
                                  }
                                }}
                              >
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500">
                                  Price: {formatCurrency(product.price).replace("₹", "₹")} | Tax: {product.tax}% |
                                  Stock: {product.stock}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = Number.parseInt(e.target.value)
                      if (val > 0) setQuantity(val)
                    }}
                  />
                </div>

                <div className="md:col-span-3">
                  <Label htmlFor="discount">Discount</Label>
                  <div className="flex">
                    <Select
                      value={discountType}
                      onValueChange={(value: "percentage" | "amount") => setDiscountType(value)}
                    >
                      <SelectTrigger className="w-[80px] rounded-r-none">
                        <SelectValue>{discountType === "percentage" ? "%" : "₹"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="amount">₹</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => {
                        const val = Number.parseFloat(e.target.value)
                        if (val >= 0) setDiscount(val)
                      }}
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <Button
                    onClick={handleAddProduct}
                    disabled={!selectedProduct}
                    className="w-full bg-gray-500 hover:bg-gray-600"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
              </div>

              {/* Summary Headers */}
              <div className="grid grid-cols-3 gap-4 border-b pb-2">
                <div className="font-medium">Discount</div>
                <div className="font-medium">Tax</div>
                <div className="font-medium">Total</div>
              </div>

              {/* Invoice Items */}
              <div className="space-y-4">
                {invoiceItems.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No products added yet</div>
                ) : (
                  invoiceItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 items-center">
                      <div>{formatCurrency(item.discount)}</div>
                      <div>{formatCurrency((item.price * item.quantity * item.tax) / 100)}</div>
                      <div className="flex justify-between">
                        <span>{formatCurrency(item.total + (item.price * item.quantity * item.tax) / 100)}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                          <span className="sr-only">Remove</span>
                          <span aria-hidden>×</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total */}
              <div className="flex justify-end border-t pt-4">
                <div className="text-right">
                  <div className="font-bold">Total:</div>
                  <div className="text-xl font-bold">{formatCurrency(calculateGrandTotal())}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || invoiceItems.length === 0}
                  className="bg-[#0f172a] hover:bg-[#1e293b]"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
