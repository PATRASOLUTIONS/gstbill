"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { toast } from "@/components/ui/use-toast"

export default function CreateSaleClientPage() {
  const router = useRouter()
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [status, setStatus] = useState("Pending")
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [insufficientStock, setInsufficientStock] = useState([])

  useEffect(() => {
    // Fetch available products
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products")
        if (!response.ok) throw new Error("Failed to fetch products")
        const data = await response.json()

        // Ensure data is an array
        if (Array.isArray(data)) {
          setAvailableProducts(data)
        } else {
          console.error("API returned non-array data:", data)
          setAvailableProducts([])
          toast({
            title: "Error",
            description: "Invalid product data format. Please contact support.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching products:", error)
        setAvailableProducts([])
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchProducts()
  }, [])

  const handleAddProduct = () => {
    if (!selectedProduct || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a product and enter a valid quantity.",
        variant: "destructive",
      })
      return
    }

    const product = availableProducts.find((p) => p._id === selectedProduct)
    if (!product) return

    // Check if product already exists in the list
    const existingProductIndex = products.findIndex((p) => p.productId === selectedProduct)

    if (existingProductIndex >= 0) {
      // Update quantity of existing product
      const updatedProducts = [...products]
      updatedProducts[existingProductIndex].quantity += quantity
      updatedProducts[existingProductIndex].subtotal =
        updatedProducts[existingProductIndex].quantity * updatedProducts[existingProductIndex].price
      setProducts(updatedProducts)
    } else {
      // Add new product
      setProducts([
        ...products,
        {
          productId: selectedProduct,
          name: product.name,
          price: product.price,
          quantity: quantity,
          subtotal: product.price * quantity,
          currentStock: product.quantity,
        },
      ])
    }

    // Reset selection
    setSelectedProduct("")
    setQuantity(1)
  }

  const handleRemoveProduct = (index) => {
    const updatedProducts = [...products]
    updatedProducts.splice(index, 1)
    setProducts(updatedProducts)
  }

  const calculateTotal = () => {
    return products.reduce((total, product) => total + product.subtotal, 0)
  }

  const validateStock = () => {
    if (status !== "Completed") {
      return true
    }

    const insufficientItems = products.filter((product) => product.quantity > product.currentStock)

    setInsufficientStock(insufficientItems)
    return insufficientItems.length === 0
  }

  const handleSubmit = async () => {
    if (!customerName || !paymentMethod || products.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add at least one product.",
        variant: "destructive",
      })
      return
    }

    // Validate stock if status is Completed
    if (!validateStock()) {
      setShowConfirmation(true)
      return
    }

    await createSale()
  }

  const createSale = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          products: Array.isArray(products)
            ? products.map((p) => ({
                productId: p.productId,
                name: p.name,
                price: p.price,
                quantity: p.quantity,
                subtotal: p.subtotal,
              }))
            : [],
          totalAmount: calculateTotal(),
          paymentMethod,
          status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create sale")
      }

      toast({
        title: "Success",
        description: "Sale created successfully!",
      })

      router.push("/sales")
      router.refresh()
    } catch (error) {
      console.error("Error creating sale:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create sale. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowConfirmation(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Sale</CardTitle>
          <CardDescription>Enter customer and product details to create a new sale.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter customer email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter customer phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Mobile Payment">Mobile Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={status} onValueChange={setStatus}>
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
            </div>

            <div className="border p-4 rounded-md">
              <h3 className="text-lg font-medium mb-4">Add Products</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(availableProducts) &&
                        availableProducts.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name} (${product.price.toFixed(2)}) - Stock: {product.quantity}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddProduct} className="w-full">
                    Add Product
                  </Button>
                </div>
              </div>

              {products.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(products) &&
                      products.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>${product.subtotal.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveProduct(index)}>
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-gray-500">No products added yet.</div>
              )}

              {products.length > 0 && (
                <div className="mt-4 text-right">
                  <p className="text-lg font-bold">Total: ${calculateTotal().toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Sale"}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Insufficient Stock Warning</AlertDialogTitle>
            <AlertDialogDescription>
              The following products don't have enough stock:
              <ul className="list-disc pl-5 mt-2">
                {Array.isArray(insufficientStock) &&
                  insufficientStock.map((product, index) => (
                    <li key={index}>
                      {product.name}: Requested {product.quantity}, Available {product.currentStock}
                    </li>
                  ))}
              </ul>
              Do you want to continue anyway? This will result in negative inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={createSale}>Continue Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
