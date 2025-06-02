"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash, Eye } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/utils/format-currency"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface Product {
  _id: string
  name: string
  sku: string
  description?: string
  category: string
  price?: number
  cost: number
  quantity: number
  reorderLevel: number
  tax: number
  sellingPrice?: number
  purchasePrice?: number
  taxRate?: number
  hsn?: string
  supplierId?: string
  supplier?: string
  barcode?: string
  location?: string
  createdAt?: string
  updatedAt?: string
  lastModified?: string
  lastModifiedFrom?: string
}

interface ProductsTableProps {
  products: Product[]
}

export function ProductsTable({ products }: ProductsTableProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>("")

  // Start editing a field
  const startEditing = (id: string, field: string, value: any) => {
    setEditingId(id)
    setEditingField(field)
    setEditingValue(value.toString())
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null)
    setEditingField(null)
    setEditingValue("")
  }

  // Save edited value
  const saveEditing = async (id: string) => {
    if (!editingField) return

    try {
      // Find the product being edited
      const product = products.find((p) => p._id === id)
      if (!product) return

      // Create updated product data
      const updatedProduct = { ...product }

      // Handle special case for selling price and cost
      if (editingField === "sellingPrice") {
        const newSellingPrice = Number.parseFloat(editingValue)
        updatedProduct.sellingPrice = newSellingPrice
        // Recalculate cost price (selling price / 1.18)
        updatedProduct.cost = Number.parseFloat((newSellingPrice / 1.18).toFixed(2))
      } else if (editingField === "cost") {
        const newCost = Number.parseFloat(editingValue)
        updatedProduct.cost = newCost
        // Recalculate selling price (cost * 1.18)
        updatedProduct.sellingPrice = Number.parseFloat((newCost * 1.18).toFixed(2))
      } else {
        // For other fields, just update the value
        ;(updatedProduct as any)[editingField] = ["quantity", "reorderLevel", "tax"].includes(editingField)
          ? Number.parseInt(editingValue, 10)
          : editingValue
      }

      // Send update to API
      const response = await fetch(`/api/products?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...updatedProduct,
          lastModified: new Date(),
          lastModifiedFrom: "products-table",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update product")
      }

      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      })

      // Reset editing state
      setEditingId(null)
      setEditingField(null)
      setEditingValue("")

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle key press in editable field
  const handleKeyPress = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      saveEditing(id)
    } else if (e.key === "Escape") {
      cancelEditing()
    }
  }

  // Get stock status badge
  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (quantity <= reorderLevel) {
      return (
        <Badge variant="outline" className="border-yellow-500 bg-yellow-100 text-yellow-800">
          Low Stock
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="border-green-500 bg-green-100 text-green-800">
          In Stock
        </Badge>
      )
    }
  }

  // Handle view product details
  const handleViewProduct = (product: Product) => {
    // This would typically open a modal with product details
    console.log("View product:", product)
    toast({
      title: "View Product",
      description: `Viewing details for ${product.name}`,
    })
  }

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    // This would typically open an edit form
    console.log("Edit product:", product)
    toast({
      title: "Edit Product",
      description: `Editing ${product.name}`,
    })
  }

  // Handle delete product
  const handleDeleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete product")
      }

      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      })

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Purchase Price</TableHead>
            <TableHead>Selling Price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product._id}>
                <TableCell className="font-medium">
                  {editingId === product._id && editingField === "name" ? (
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => saveEditing(product._id)}
                      onKeyDown={(e) => handleKeyPress(e, product._id)}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => startEditing(product._id, "name", product.name)}
                    >
                      {product.name}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === product._id && editingField === "category" ? (
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => saveEditing(product._id)}
                      onKeyDown={(e) => handleKeyPress(e, product._id)}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => startEditing(product._id, "category", product.category)}
                    >
                      {product.category}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {product.purchasePrice ? formatCurrency(product.purchasePrice) : formatCurrency(product.cost)}
                </TableCell>
                <TableCell>
                  {editingId === product._id && editingField === "sellingPrice" ? (
                    <Input
                      type="number"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => saveEditing(product._id)}
                      onKeyDown={(e) => handleKeyPress(e, product._id)}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() =>
                        startEditing(
                          product._id,
                          "sellingPrice",
                          product.sellingPrice || (product.cost * 1.18).toFixed(2),
                        )
                      }
                    >
                      {formatCurrency(product.sellingPrice || product.cost * 1.18)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === product._id && editingField === "quantity" ? (
                    <Input
                      type="number"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => saveEditing(product._id)}
                      onKeyDown={(e) => handleKeyPress(e, product._id)}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => startEditing(product._id, "quantity", product.quantity)}
                    >
                      {product.quantity}
                    </span>
                  )}
                </TableCell>
                <TableCell>{getStockStatus(product.quantity, product.reorderLevel)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProduct(product._id)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
