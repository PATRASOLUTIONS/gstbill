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
import { toast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

interface Product {
  _id: string
  name: string
  price: number
  quantity: number
}

interface Customer {
  _id: string
  name: string
  email: string
  phone: string
}

export default function CreateInvoiceForm() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [productQuantity, setProductQuantity] = useState(1)
  const [invoiceStatus, setInvoiceStatus] = useState("Pending")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("")
  const [loadingInvoiceNumber, setLoadingInvoiceNumber] = useState(true)
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    // Call the database setup endpoint to ensure indexes
    fetch("/api/db-setup").catch(console.error)

    async function fetchCustomers() {
      try {
        const response = await fetch("/api/customers")
        if (!response.ok) throw new Error("Failed to fetch customers")
        const data = await response.json()
        setCustomers(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching customers:", error)
        toast({
          title: "Error",
          description: "Failed to load customers. Please try again.",
          variant: "destructive",
        })
      }
    }

    async function fetchProducts() {
      try {
        const response = await fetch("/api/products")
        if (!response.ok) throw new Error("Failed to fetch products")
        const data = await response.json()
        setAvailableProducts(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching products:", error)
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      }
    }

    async function fetchNextInvoiceNumber() {
      if (!session?.user?.id) return

      setLoadingInvoiceNumber(true)
      try {
        const response = await fetch("/api/invoices/next-number")
        if (!response.ok) throw new Error("Failed to fetch next invoice number")
        const data = await response.json()
        setNextInvoiceNumber(data.nextInvoiceNumber)
      } catch (error) {
        console.error("Error fetching next invoice number:", error)
        toast({
          title: "Error",
          description: "Failed to determine next invoice number. A number will be assigned automatically.",
          variant: "destructive",
        })
      } finally {
        setLoadingInvoiceNumber(false)
      }
    }

    fetchCustomers()
    fetchProducts()
    fetchNextInvoiceNumber()
  }, [session?.user?.id])

  const addProduct = () => {
    if (!selectedProduct || productQuantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a product and enter a valid quantity.",
        variant: "destructive",
      })
      return
    }

    const product = availableProducts.find((p) => p._id === selectedProduct)
    if (!product) return

    const existingProduct = products.find((p) => p._id === selectedProduct)
    if (existingProduct) {
      setProducts(
        products.map((p) => (p._id === selectedProduct ? { ...p, quantity: p.quantity + productQuantity } : p)),
      )
    } else {
      setProducts([...products, { ...product, quantity: productQuantity }])
    }

    setSelectedProduct("")
    setProductQuantity(1)
  }

  const removeProduct = (productId: string) => {
    setProducts(products.filter((p) => p._id !== productId))
  }

  const calculateTotal = () => {
    return products.reduce((sum, product) => sum + product.price * product.quantity, 0)
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

    if (products.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Call db-setup again right before submitting
      await fetch("/api/db-setup")

      const customer = customers.find((c) => c._id === selectedCustomer)

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer,
          products,
          total: calculateTotal(),
          status: invoiceStatus,
          date: invoiceDate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create invoice")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: `Invoice ${data.invoiceNumber} created successfully! (ID: ${data.invoiceId.substring(0, 8)}...)`,
      })

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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create Invoice</h1>
        <Button variant="outline" onClick={() => router.push("/invoices")}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Your Next Invoice Number</Label>
                <div className="p-2 bg-gray-100 rounded mt-1">
                  {loadingInvoiceNumber ? (
                    <span className="text-gray-500">Loading...</span>
                  ) : nextInvoiceNumber ? (
                    <>
                      {nextInvoiceNumber}
                      <p className="text-xs text-gray-500 mt-1">
                        Invoice numbers are unique per user. Each invoice will also receive a globally unique ID.
                      </p>
                    </>
                  ) : (
                    <span className="text-gray-500">Will be generated automatically</span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
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

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Invoice Date</Label>
                <Input type="date" id="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product">Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name} - ${product.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  type="number"
                  id="quantity"
                  min="1"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(Number.parseInt(e.target.value))}
                />
              </div>

              <Button type="button" onClick={addProduct} className="w-full">
                Add Product
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No products added yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>${(product.price * product.quantity).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => removeProduct(product._id)}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">
                      Total:
                    </TableCell>
                    <TableCell className="font-bold">${calculateTotal().toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  )
}

