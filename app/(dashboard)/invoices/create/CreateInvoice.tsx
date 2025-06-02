"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Check, Loader2, Plus, Search, Trash2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"

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

export default function CreateInvoice() {
  const router = useRouter()
  const { toast } = useToast()

  // State for customers and products
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
    fetchProducts()
  }, [])

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

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a product and enter a valid quantity.",
        variant: "destructive",
      })
      return
    }

    const product = products.find((p) => p._id === selectedProduct)
    if (!product) {
      toast({
        title: "Error",
        description: "Selected product not found.",
        variant: "destructive",
      })
      return
    }

    // Check if product has enough quantity
    if (quantity > product.quantity) {
      toast({
        title: "Error",
        description: `Only ${product.quantity} units of ${product.name} are available in stock.`,
        variant: "destructive",
      })
      return
    }

    // Check if product already exists in invoice items
    const existingItemIndex = invoiceItems.findIndex((item) => item.productId === selectedProduct)
    if (existingItemIndex !== -1) {
      // Update existing item
      const updatedItems = [...invoiceItems]
      const existingItem = updatedItems[existingItemIndex]

      // Check if total quantity exceeds available stock
      if (existingItem.quantity + quantity > product.quantity) {
        toast({
          title: "Error",
          description: `Only ${product.quantity} units of ${product.name} are available in stock.`,
          variant: "destructive",
        })
        return
      }

      // Calculate new values
      const newQuantity = existingItem.quantity + quantity
      const newTotal = existingItem.price * newQuantity
      const newTaxAmount = (existingItem.tax / 100) * newTotal
      const newTotalWithTax = newTotal + newTaxAmount

      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        total: newTotal,
        taxAmount: newTaxAmount,
        totalWithTax: newTotalWithTax,
      }

      setInvoiceItems(updatedItems)
    } else {
      // Add new item
      const taxRate = product.taxRate || 0
      const sellingPrice = product.sellingPrice

      let price = sellingPrice
      let taxAmount = 0

      if (isGst === "gst" && taxRate > 0) {
        // For GST invoices, calculate price without tax
        const taxRateDecimal = taxRate / 100
        price = sellingPrice / (1 + taxRateDecimal)
        taxAmount = sellingPrice - price
      }

      const newItem: InvoiceItem = {
        id: uuidv4(),
        productId: product._id,
        productName: product.name,
        quantity: quantity,
        price: price,
        originalPrice: sellingPrice,
        tax: isGst === "gst" ? taxRate : 0,
        originalTax: taxRate,
        taxAmount: taxAmount * quantity,
        total: price * quantity,
        totalWithTax: sellingPrice * quantity,
      }

      setInvoiceItems([...invoiceItems, newItem])
    }

    // Reset selection
    setSelectedProduct("")
    setQuantity(1)
    setProductSearchTerm("")
  }

  const handleRemoveItem = (id: string) => {
    setInvoiceItems(invoiceItems.filter((item) => item.id !== id))
  }

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than zero.",
        variant: "destructive",
      })
      return
    }

    const itemIndex = invoiceItems.findIndex((item) => item.id === id)
    if (itemIndex === -1) return

    const item = invoiceItems[itemIndex]
    const product = products.find((p) => p._id === item.productId)

    if (!product) {
      toast({
        title: "Error",
        description: "Product not found.",
        variant: "destructive",
      })
      return
    }

    // Check if new quantity exceeds available stock
    if (newQuantity > product.quantity) {
      toast({
        title: "Error",
        description: `Only ${product.quantity} units of ${product.name} are available in stock.`,
        variant: "destructive",
      })
      return
    }

    const updatedItems = [...invoiceItems]
    const newTotal = item.price * newQuantity
    const newTaxAmount = (item.tax / 100) * newTotal
    const newTotalWithTax = newTotal + newTaxAmount

    updatedItems[itemIndex] = {
      ...item,
      quantity: newQuantity,
      total: newTotal,
      taxAmount: newTaxAmount,
      totalWithTax: newTotalWithTax,
    }

    setInvoiceItems(updatedItems)
  }

  // Calculate subtotal, tax total, and grand total
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0)
  const taxTotal = invoiceItems.reduce((sum, item) => sum + item.taxAmount, 0)
  const grandTotal = subtotal + taxTotal

  const handleGstChange = (value: string) => {
    setIsGst(value)

    // Update tax calculations for all items
    const updatedItems = invoiceItems.map((item) => {
      const effectiveTaxRate = value === "gst" ? item.originalTax : 0

      if (value === "gst" && item.originalTax > 0) {
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
    })

    setInvoiceItems(updatedItems)
  }

  const handleSubmit = async (status: "draft" | "pending") => {
    // Validation
    if (!selectedCustomer && !showWalkinInput) {
      toast({
        title: "Error",
        description: "Please select a customer.",
        variant: "destructive",
      })
      return
    }

    if (showWalkinInput && !walkinCustomerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter walk-in customer name.",
        variant: "destructive",
      })
      return
    }

    if (invoiceItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the invoice.",
        variant: "destructive",
      })
      return
    }

    if (!invoiceDate || !dueDate) {
      toast({
        title: "Error",
        description: "Please select invoice date and due date.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Get customer details
      let customerName = ""
      let customerId = ""

      if (showWalkinInput) {
        customerName = walkinCustomerName
      } else {
        const customer = customers.find((c) => c._id === selectedCustomer)
        if (customer) {
          customerName = customer.name
          customerId = customer._id
        }
      }

      // Prepare invoice data
      const invoiceData = {
        customerId,
        customerName,
        date: invoiceDate.toISOString(),
        dueDate: dueDate.toISOString(),
        items: invoiceItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          tax: item.tax,
          taxAmount: item.taxAmount,
          total: item.total,
        })),
        subtotal,
        taxTotal,
        total: grandTotal,
        status,
        paymentMethod,
        notes,
        isGst: isGst === "gst",
      }

      // Send request to create invoice
      const response = await fetch("/api/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create invoice")
      }

      const data = await response.json()

      // Show success message
      toast({
        title: "Success",
        description: `Invoice ${status === "draft" ? "draft" : ""} created successfully!`,
      })

      setSuccessMessage(`Invoice ${status === "draft" ? "draft" : ""} created successfully!`)
      setLastCreatedInvoiceId(data.invoice._id)

      // Reset form if not viewing the created invoice
      if (!data.invoice._id) {
        resetForm()
      }
    } catch (error) {
      console.error("Error creating invoice:", error)
      setError(error instanceof Error ? error.message : "Failed to create invoice")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedCustomer("")
    setWalkinCustomerName("")
    setShowWalkinInput(false)
    setInvoiceDate(new Date())
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    setPaymentMethod("Bank Transfer")
    setNotes("")
    setInvoiceItems([])
    setSelectedProduct("")
    setQuantity(1)
    setCustomerSearchTerm("")
    setProductSearchTerm("")
    setIsGst("gst")
    setSuccessMessage(null)
    setLastCreatedInvoiceId(null)
    setCurrentStep(1)
  }

  const handleViewInvoice = () => {
    if (lastCreatedInvoiceId) {
      router.push(`/invoices/${lastCreatedInvoiceId}`)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Invoice</CardTitle>
          <CardDescription>Create a new invoice for your customer</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
              {lastCreatedInvoiceId && (
                <Button variant="outline" size="sm" onClick={handleViewInvoice} className="mt-2">
                  View Invoice
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={resetForm} className="mt-2 ml-2">
                Create Another Invoice
              </Button>
            </Alert>
          )}

          {!successMessage && (
            <Tabs defaultValue="customer" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="customer" disabled={currentStep !== 1}>
                  1. Customer & Details
                </TabsTrigger>
                <TabsTrigger value="items" disabled={currentStep !== 2}>
                  2. Items & Review
                </TabsTrigger>
              </TabsList>

              <TabsContent value="customer" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
                    {!showWalkinInput ? (
                      <div className="flex flex-col space-y-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="search"
                            placeholder="Search customers..."
                            className="pl-8"
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                          />
                        </div>
                        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customersLoading ? (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading customers...
                              </div>
                            ) : filteredCustomers.length === 0 ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">No customers found</div>
                            ) : (
                              filteredCustomers.map((customer) => (
                                <SelectItem key={customer._id} value={customer._id}>
                                  {customer.name} {customer.contact ? `(${customer.contact})` : ""}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setShowWalkinInput(true)}>
                            Add Walk-in Customer
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/customers/new")}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            New Customer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        <Input
                          type="text"
                          placeholder="Walk-in customer name"
                          value={walkinCustomerName}
                          onChange={(e) => setWalkinCustomerName(e.target.value)}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowWalkinInput(false)}>
                          Select Existing Customer
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceDate">Invoice Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !invoiceDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={invoiceDate} onSelect={setInvoiceDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dueDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceType">Invoice Type</Label>
                    <RadioGroup value={isGst} onValueChange={handleGstChange} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gst" id="gst" />
                        <Label htmlFor="gst">GST Invoice</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="non-gst" id="non-gst" />
                        <Label htmlFor="non-gst">Non-GST Invoice</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any additional notes here"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={(!selectedCustomer && !walkinCustomerName) || !invoiceDate || !dueDate}
                    >
                      Next: Add Items
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="items" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Add Products</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="search"
                            placeholder="Search products..."
                            className="pl-8"
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                          />
                        </div>
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {productsLoading ? (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading products...
                              </div>
                            ) : filteredProducts.length === 0 ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">No products found</div>
                            ) : (
                              filteredProducts.map((product) => (
                                <SelectItem key={product._id} value={product._id}>
                                  {product.name} (₹{product.sellingPrice.toFixed(2)}) - {product.quantity} in stock
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          type="number"
                          id="quantity"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="flex items-end">
                        <Button type="button" onClick={handleAddItem} className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Item
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Invoice Items</Label>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Tax</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center">
                                No items added to invoice.
                              </TableCell>
                            </TableRow>
                          ) : (
                            invoiceItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.productName}</TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleUpdateQuantity(item.id, Number.parseInt(e.target.value) || 0)
                                    }
                                    className="w-20 text-right"
                                  />
                                </TableCell>
                                <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  {item.tax > 0 ? `${item.tax}% (₹${item.taxAmount.toFixed(2)})` : "N/A"}
                                </TableCell>
                                <TableCell className="text-right">₹{item.totalWithTax.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>₹{taxTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                      Back to Customer Details
                    </Button>
                    <div className="space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSubmit("draft")}
                        disabled={isSubmitting || invoiceItems.length === 0}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save as Draft"
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleSubmit("pending")}
                        disabled={isSubmitting || invoiceItems.length === 0}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Invoice"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

