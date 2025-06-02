"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Customer, Product } from "@/lib/types"
import { Loader2, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CreateSaleStep2Props {
  onSubmit: (data: {
    products: { productId: string; quantity: number; price: number }[]
    selectedProducts: Product[]
    paymentMethod: string
    paymentStatus: string
    notes: string
  }) => void
  onBack: () => void
  customerId: string
  customer: Customer | null
  initialSelectedProducts?: Product[]
  setSelectedProducts: (products: Product[]) => void
}

export function CreateSaleStep2({
  onSubmit,
  onBack,
  customerId,
  customer,
  initialSelectedProducts = [],
  setSelectedProducts,
}: CreateSaleStep2Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProductItems, setSelectedProductItems] = useState<
    {
      productId: string
      quantity: number
      price: number
    }[]
  >([])
  const [currentProduct, setCurrentProduct] = useState("")
  const [currentQuantity, setCurrentQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [paymentStatus, setPaymentStatus] = useState("paid")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products")
        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }
        const data = await response.json()
        setProducts(data)

        // Initialize selected products from initialSelectedProducts
        if (initialSelectedProducts.length > 0) {
          const initialItems = initialSelectedProducts.map((product) => ({
            productId: product._id,
            quantity: 1,
            price: product.price,
          }))
          setSelectedProductItems(initialItems)
        }
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [initialSelectedProducts])

  const handleAddProduct = () => {
    if (!currentProduct || currentQuantity <= 0) return

    const product = products.find((p) => p._id === currentProduct)
    if (!product) return

    // Check if product already exists in the list
    const existingIndex = selectedProductItems.findIndex((item) => item.productId === currentProduct)

    if (existingIndex >= 0) {
      // Update existing product quantity
      const updatedItems = [...selectedProductItems]
      updatedItems[existingIndex].quantity += currentQuantity
      setSelectedProductItems(updatedItems)
    } else {
      // Add new product
      const newItem = {
        productId: currentProduct,
        quantity: currentQuantity,
        price: product.price,
      }

      setSelectedProductItems([...selectedProductItems, newItem])

      // Update selected products for parent component
      const updatedSelectedProducts = [...initialSelectedProducts, product]
      setSelectedProducts(updatedSelectedProducts)
    }

    // Reset selection
    setCurrentProduct("")
    setCurrentQuantity(1)
  }

  const handleRemoveProduct = (index: number) => {
    const updatedItems = [...selectedProductItems]
    updatedItems.splice(index, 1)
    setSelectedProductItems(updatedItems)

    // Update selected products for parent component
    const updatedSelectedProducts = [...initialSelectedProducts]
    updatedSelectedProducts.splice(index, 1)
    setSelectedProducts(updatedSelectedProducts)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (selectedProductItems.length === 0) {
      alert("Please add at least one product")
      setIsSubmitting(false)
      return
    }

    onSubmit({
      products: selectedProductItems,
      selectedProducts: initialSelectedProducts,
      paymentMethod,
      paymentStatus,
      notes,
    })
  }

  const calculateTotal = () => {
    return selectedProductItems.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {customer && (
        <div className="rounded-md border p-2 bg-muted/50">
          <p className="text-sm font-medium">Customer: {customer.name}</p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-medium">Add Products</h3>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="product">Product</Label>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading products...</span>
              </div>
            ) : (
              <Select value={currentProduct} onValueChange={setCurrentProduct}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name} - ₹{product.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="w-24">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={currentQuantity}
              onChange={(e) => setCurrentQuantity(Number.parseInt(e.target.value) || 1)}
            />
          </div>

          <Button type="button" onClick={handleAddProduct} disabled={!currentProduct || loading}>
            Add
          </Button>
        </div>

        {selectedProductItems.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedProductItems.map((item, index) => {
                  const product = products.find((p) => p._id === item.productId)
                  return (
                    <TableRow key={index}>
                      <TableCell>{product?.name || "Unknown Product"}</TableCell>
                      <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveProduct(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Total:
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{calculateTotal().toFixed(2)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-4 border rounded-md text-muted-foreground">No products added yet</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger id="paymentMethod">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentStatus">Payment Status</Label>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger id="paymentStatus">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes here..."
          rows={3}
        />
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back: Select Customer
        </Button>
        <Button type="submit" disabled={selectedProductItems.length === 0 || isSubmitting}>
          {isSubmitting ? "Creating Sale..." : "Create Sale"}
        </Button>
      </div>
    </form>
  )
}
