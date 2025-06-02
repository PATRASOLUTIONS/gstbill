"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

export default function CreateSaleForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [nextSaleNumber, setNextSaleNumber] = useState("")

  const [formData, setFormData] = useState({
    salesId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    paymentMethod: "cash",
    status: "pending",
    products: [],
    totalAmount: 0,
  })

  useEffect(() => {
    // Fetch customers
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCustomers(data.data || [])
        }
      })
      .catch((error) => {
        console.error("Error fetching customers:", error)
        toast({
          title: "Error",
          description: "Failed to load customers. Please try again.",
          variant: "destructive",
        })
      })

    // Fetch products
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.data || [])
        }
      })
      .catch((error) => {
        console.error("Error fetching products:", error)
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      })

    // Get next sale number
    fetch("/api/sales/next-number")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNextSaleNumber(data.nextNumber || "")
          setFormData((prev) => ({ ...prev, salesId: data.nextNumber || "" }))
        }
      })
      .catch((error) => {
        console.error("Error fetching next sale number:", error)
        toast({
          title: "Error",
          description: "Failed to generate sale number. Please try again.",
          variant: "destructive",
        })
      })
  }, [])

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find((c) => c._id === customerId)
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerName: customer.name || "",
        customerEmail: customer.email || "",
        customerPhone: customer.contact || "",
      }))
    }
  }

  const handleProductSelect = (productId) => {
    const product = products.find((p) => p._id === productId)
    if (product && !selectedProducts.some((p) => p._id === product._id)) {
      const newProduct = {
        ...product,
        quantity: 1,
        total: product.price,
      }
      setSelectedProducts([...selectedProducts, newProduct])

      // Update form data
      const updatedProducts = [
        ...formData.products,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          total: product.price,
        },
      ]

      const newTotal = updatedProducts.reduce((sum, item) => sum + item.total, 0)

      setFormData((prev) => ({
        ...prev,
        products: updatedProducts,
        totalAmount: newTotal,
      }))
    }
  }

  const handleQuantityChange = (index, quantity) => {
    const qty = Number.parseInt(quantity) || 1
    if (qty < 1) return

    const updatedProducts = [...selectedProducts]
    updatedProducts[index].quantity = qty
    updatedProducts[index].total = qty * updatedProducts[index].price
    setSelectedProducts(updatedProducts)

    // Update form data
    const updatedFormProducts = [...formData.products]
    updatedFormProducts[index].quantity = qty
    updatedFormProducts[index].total = qty * updatedFormProducts[index].price

    const newTotal = updatedFormProducts.reduce((sum, item) => sum + item.total, 0)

    setFormData((prev) => ({
      ...prev,
      products: updatedFormProducts,
      totalAmount: newTotal,
    }))
  }

  const removeProduct = (index) => {
    const updatedProducts = selectedProducts.filter((_, i) => i !== index)
    setSelectedProducts(updatedProducts)

    // Update form data
    const updatedFormProducts = formData.products.filter((_, i) => i !== index)
    const newTotal = updatedFormProducts.reduce((sum, item) => sum + item.total, 0)

    setFormData((prev) => ({
      ...prev,
      products: updatedFormProducts,
      totalAmount: newTotal,
    }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.products.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product to the sale.",
        variant: "destructive",
      })
      return
    }

    if (!formData.customerName) {
      toast({
        title: "Error",
        description: "Please enter customer information.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Sale created successfully!",
        })
        router.push("/sales")
      } else {
        throw new Error(data.message || "Failed to create sale")
      }
    } catch (error) {
      console.error("Error creating sale:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create sale. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sale Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salesId">Sale Number</Label>
              <Input id="salesId" name="salesId" value={formData.salesId} onChange={handleInputChange} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Customer</Label>
            <Select onValueChange={handleCustomerSelect}>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentMethod: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Add Product</Label>
            <Select onValueChange={handleProductSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product._id} value={product._id}>
                    {product.name} - ${product.price.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProducts.length > 0 ? (
            <div className="border rounded-md">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-left">Price</th>
                    <th className="p-2 text-left">Quantity</th>
                    <th className="p-2 text-left">Total</th>
                    <th className="p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((product, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{product.name}</td>
                      <td className="p-2">${product.price.toFixed(2)}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-20"
                        />
                      </td>
                      <td className="p-2">${product.total.toFixed(2)}</td>
                      <td className="p-2">
                        <Button variant="destructive" size="sm" onClick={() => removeProduct(index)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted">
                  <tr>
                    <td colSpan={3} className="p-2 text-right font-bold">
                      Total:
                    </td>
                    <td className="p-2 font-bold">${formData.totalAmount.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center p-4 border rounded-md bg-muted">
              No products added yet. Please select products from the dropdown above.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/sales")} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || selectedProducts.length === 0}>
            {isLoading ? "Creating..." : "Create Sale"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
