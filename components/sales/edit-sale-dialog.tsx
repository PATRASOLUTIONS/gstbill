"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2, Plus, Loader2 } from "lucide-react"
import { formatCurrency } from "@/utils/format-currency"

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

interface EditSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: string | null
  onSaleUpdated: () => void
}

export function EditSaleDialog({ open, onOpenChange, saleId, onSaleUpdated }: EditSaleDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Form state
  const [formData, setFormData] = useState({
    customer: "",
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

  // Fetch sale details when dialog opens
  useEffect(() => {
    if (open && saleId) {
      console.log("EditSaleDialog opened with saleId:", saleId)
      fetchSaleDetails(saleId)
      fetchCustomers()
      fetchProducts()
    } else {
      // Reset form when dialog closes
      resetForm()
    }
  }, [open, saleId])

  const resetForm = () => {
    setFormData({
      customer: "",
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
      total: 0,
      status: "Pending",
      paymentStatus: "Unpaid",
      notes: "",
    })
    setFormErrors({
      customer: "",
      items: [{ product: "", quantity: "" }],
    })
  }

  const fetchSaleDetails = async (id: string) => {
    try {
      setLoading(true)
      console.log("Fetching sale details for:", id)
      const response = await fetch(`/api/sales/${id}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to fetch sale details")
      }

      const data = await response.json()
      console.log("Sale details received:", data)

      // Format the date to YYYY-MM-DD for the input field
      const formattedDate = new Date(data.sale.saleDate).toISOString().split("T")[0]

      setFormData({
        ...data.sale,
        saleDate: formattedDate,
        customer: data.sale.customer?._id || "",
      })

      // Initialize form errors array to match items length
      setFormErrors({
        customer: "",
        items: data.sale.items.map(() => ({ product: "", quantity: "" })),
      })
    } catch (error) {
      console.error("Error fetching sale details:", error)
      toast({
        title: "Error",
        description: "Failed to load sale details. Please try again.",
        variant: "destructive",
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      if (!response.ok) {
        throw new Error("Failed to fetch customers")
      }
      const data = await response.json()
      setCustomers(data.customers || [])
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

  // Handle product selection
  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = products.find((p) => p._id === productId)

    if (!selectedProduct) return

    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      product: productId,
      productName: selectedProduct.name,
      price: selectedProduct.sellingPrice || selectedProduct.price,
      quantity: updatedItems[index].quantity || 1,
      taxRate: selectedProduct.tax || 0,
      taxAmount:
        ((selectedProduct.sellingPrice || selectedProduct.price) *
          (updatedItems[index].quantity || 1) *
          (selectedProduct.tax || 0)) /
        100,
      total:
        (selectedProduct.sellingPrice || selectedProduct.price) * (updatedItems[index].quantity || 1) +
        ((selectedProduct.sellingPrice || selectedProduct.price) *
          (updatedItems[index].quantity || 1) *
          (selectedProduct.tax || 0)) /
          100,
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
    item.taxAmount = item.price * quantity * (item.taxRate / 100)
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

  // Handle tax rate change
  const handleTaxRateChange = (index: number, taxRate: number) => {
    const updatedItems = [...formData.items]
    const item = updatedItems[index]

    // Update tax rate and recalculate
    item.taxRate = taxRate
    item.taxAmount = item.price * item.quantity * (taxRate / 100)
    item.total = item.price * item.quantity + item.taxAmount

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }))

    // Recalculate totals
    calculateTotals(updatedItems)
  }

  // Handle price change
  const handlePriceChange = (index: number, price: number) => {
    const updatedItems = [...formData.items]
    const item = updatedItems[index]

    // Update price and recalculate
    item.price = price
    item.taxAmount = price * item.quantity * (item.taxRate / 100)
    item.total = price * item.quantity + item.taxAmount

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }))

    // Recalculate totals
    calculateTotals(updatedItems)
  }

  // Calculate totals
  const calculateTotals = (items: SaleItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0)
    const total = subtotal + taxTotal

    setFormData((prev) => ({
      ...prev,
      subtotal,
      taxTotal,
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

      if (item.quantity < 1) {
        errors.items[index].quantity = "Quantity must be at least 1"
        isValid = false
      }
    })

    setFormErrors(errors)
    return isValid
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm() || !saleId) return

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/sales/${saleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to update sale")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to update sale")
      }

      onOpenChange(false)
      onSaleUpdated()

      toast({
        title: "Success",
        description: "Sale updated successfully",
      })
    } catch (error) {
      console.error("Error updating sale:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update sale. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Edit Sale</DialogTitle>
          <DialogDescription>Update the details of this sale.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">
                Customer <span className="text-red-500">*</span>
              </Label>
              <Select
                name="customer"
                value={formData.customer}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, customer: value }))}
              >
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.customer && <p className="text-sm text-red-500">{formErrors.customer}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="saleDate">Sale Date</Label>
              <Input id="saleDate" name="saleDate" type="date" value={formData.saleDate} onChange={handleInputChange} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Products</Label>
              <Button type="button" variant="outline" size="sm" onClick={addNewItem}>
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end border p-2 rounded-md">
                  <div className="col-span-4 space-y-1">
                    <Label htmlFor={`product-${index}`}>
                      Product <span className="text-red-500">*</span>
                    </Label>
                    <Select value={item.product} onValueChange={(value) => handleProductSelect(index, value)}>
                      <SelectTrigger id={`product-${index}`}>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name} ({formatCurrency(product.price)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Label htmlFor={`price-${index}`}>Selling Price</Label>
                    <Input
                      id={`price-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handlePriceChange(index, Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label htmlFor={`tax-${index}`}>Tax Rate</Label>
                    <Select
                      value={item.taxRate.toString()}
                      onValueChange={(value) => handleTaxRateChange(index, Number.parseFloat(value))}
                    >
                      <SelectTrigger id={`tax-${index}`}>
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

                  <div className="col-span-2 space-y-1">
                    <Label htmlFor={`total-${index}`}>Total</Label>
                    <Input id={`total-${index}`} type="number" value={item.total} readOnly className="bg-muted" />
                  </div>

                  <div className="col-span-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <span>Total:</span>
              <span>{formatCurrency(formData.total)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Updating...
              </>
            ) : (
              "Update Sale"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
