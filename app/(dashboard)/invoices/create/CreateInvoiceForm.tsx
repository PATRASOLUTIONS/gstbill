"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { CalendarIcon, Trash2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Product {
  _id: string
  name: string
  price: number
  stock: number
  category?: string
}

interface Customer {
  _id: string
  name: string
  email: string
  phone: string
  address?: string
}

interface InvoiceItem {
  productId: string
  productName: string
  quantity: number
  price: number
  total: number
}

export default function CreateInvoiceForm() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [productQuantity, setProductQuantity] = useState(1)
  const [invoiceType, setInvoiceType] = useState("gst")
  const [paymentMethod, setPaymentMethod] = useState("bank-transfer")
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date())
  const [dueDate, setDueDate] = useState<Date>(new Date())
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("")
  const [loadingData, setLoadingData] = useState(true)

  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    fetchInitialData()
  }, [session?.user?.id])

  const fetchInitialData = async () => {
    if (!session?.user?.id) return

    setLoadingData(true)
    try {
      // Fetch customers, products, and next invoice number in parallel
      const [customersRes, productsRes, invoiceNumberRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/products"),
        fetch("/api/invoices/generate-number"),
      ])

      if (customersRes.ok) {
        const customersData = await customersRes.json()
        setCustomers(Array.isArray(customersData) ? customersData : [])
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(Array.isArray(productsData) ? productsData : [])
      }

      if (invoiceNumberRes.ok) {
        const invoiceNumberData = await invoiceNumberRes.json()
        setNextInvoiceNumber(invoiceNumberData.invoiceNumber || "")
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast({
        title: "Error",
        description: "Failed to load initial data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const addProduct = () => {
    if (!selectedProduct || productQuantity <= 0) {
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

    if (product.stock < productQuantity) {
      toast({
        title: "Error",
        description: `Insufficient stock. Available: ${product.stock}`,
        variant: "destructive",
      })
      return
    }

    const existingItemIndex = invoiceItems.findIndex((item) => item.productId === selectedProduct)

    if (existingItemIndex >= 0) {
      const updatedItems = [...invoiceItems]
      updatedItems[existingItemIndex].quantity += productQuantity
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * product.price
      setInvoiceItems(updatedItems)
    } else {
      const newItem: InvoiceItem = {
        productId: product._id,
        productName: product.name,
        quantity: productQuantity,
        price: product.price,
        total: product.price * productQuantity,
      }
      setInvoiceItems([...invoiceItems, newItem])
    }

    setSelectedProduct("")
    setProductQuantity(1)
  }

  const removeProduct = (productId: string) => {
    setInvoiceItems(invoiceItems.filter((item) => item.productId !== productId))
  }

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTax = () => {
    if (invoiceType === "non-gst") return 0
    return calculateSubtotal() * 0.18 // 18% GST
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer.",
        variant: "destructive",
      })
      return
    }

    if (invoiceItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const customer = customers.find((c) => c._id === selectedCustomer)
      if (!customer) {
        throw new Error("Selected customer not found")
      }

      const invoiceData = {
        invoiceNumber: nextInvoiceNumber,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address || "",
        },
        items: invoiceItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        subtotal: calculateSubtotal(),
        taxAmount: calculateTax(),
        total: calculateTotal(),
        invoiceType,
        paymentMethod,
        invoiceDate: invoiceDate.toISOString(),
        dueDate: dueDate.toISOString(),
        notes,
        status: "pending",
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create invoice")
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: `Invoice ${result.invoiceNumber} created successfully!`,
      })

      // Redirect to invoices page
      router.push("/invoices")
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="border border-gray-200">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-semibold">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit}>
            {/* Invoice Number */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Invoice Number</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <span className="text-sm">{nextInvoiceNumber || "Loading..."}</span>
              </div>
            </div>

            {/* Invoice Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Invoice Type</Label>
              <RadioGroup value={invoiceType} onValueChange={setInvoiceType} className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gst" id="gst" />
                  <Label htmlFor="gst" className="text-sm">
                    GST Invoice
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non-gst" id="non-gst" />
                  <Label htmlFor="non-gst" className="text-sm">
                    Non-GST Invoice
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Customer</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Loading customers..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Bank Transfer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Invoice Date</Label>
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
                      {invoiceDate ? format(invoiceDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={invoiceDate}
                      onSelect={(date) => date && setInvoiceDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => date && setDueDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Add Products Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Add Products</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.name} - ₹{product.price} (Stock: {product.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(Number.parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">&nbsp;</Label>
                  <Button type="button" onClick={addProduct} className="w-full">
                    Add Product
                  </Button>
                </div>
              </div>
            </div>

            {/* Invoice Items Table */}
            {invoiceItems.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Invoice Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.price.toFixed(2)}</TableCell>
                        <TableCell>₹{item.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeProduct(item.productId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  {invoiceType === "gst" && (
                    <div className="flex justify-between">
                      <span>Tax (18%):</span>
                      <span>₹{calculateTax().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                placeholder="Enter any additional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={() => router.push("/invoices")}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || invoiceItems.length === 0}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {loading ? "Creating..." : "Next"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
