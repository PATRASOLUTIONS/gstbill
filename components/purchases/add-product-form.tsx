"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddProductFormProps {
  newProductData: {
    name: string
    sku: string
    category: string
    quantity: number
    cost: number
    sellingPrice: number
    taxRate: number
    reorderLevel: number
    supplierId: string
    purchasePrice: number
  }
  categories: { _id: string; name: string; type: string }[]
  suppliers: { _id: string; name: string }[]
  isSubmitting: boolean
  onCancel: () => void
  onSubmit: () => void
  onChange: (field: string, value: string | number) => void
  calculatePurchasePrice: (cost: number, taxRate: number) => number
}

export function AddProductForm({
  newProductData,
  categories,
  suppliers,
  isSubmitting,
  onCancel,
  onSubmit,
  onChange,
  calculatePurchasePrice,
}: AddProductFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [skuExists, setSkuExists] = useState(false)
  const [isGeneratingSku, setIsGeneratingSku] = useState(false)

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!newProductData.name.trim()) {
      newErrors.name = "Product name is required"
    }

    if (!newProductData.sku.trim()) {
      newErrors.sku = "SKU is required"
    }

    if (!newProductData.supplierId) {
      newErrors.supplierId = "Supplier is required"
    }

    if (newProductData.cost < 0) {
      newErrors.cost = "Cost cannot be negative"
    }

    if (newProductData.sellingPrice < 0) {
      newErrors.sellingPrice = "Selling price cannot be negative"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if SKU exists
  const checkSkuExists = async (sku: string) => {
    if (!sku.trim()) return

    try {
      const response = await fetch(`/api/products?query=${sku}`)
      if (response.ok) {
        const data = await response.json()
        const exists = data.products.some((product: any) => product.sku === sku)
        setSkuExists(exists)

        if (exists) {
          setErrors((prev) => ({ ...prev, sku: "This SKU already exists" }))
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.sku
            return newErrors
          })
        }
      }
    } catch (error) {
      console.error("Error checking SKU:", error)
    }
  }

  // Generate unique SKU
  const generateUniqueSku = async () => {
    setIsGeneratingSku(true)
    try {
      // Get current date components
      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = (now.getMonth() + 1).toString().padStart(2, "0")
      const day = now.getDate().toString().padStart(2, "0")

      // Generate random component
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")

      // Create base SKU
      const baseSku = `P${year}${month}${day}-${random}`

      // Check if it exists
      const response = await fetch(`/api/products?query=${baseSku}`)
      if (response.ok) {
        const data = await response.json()
        const exists = data.products.some((product: any) => product.sku === baseSku)

        if (exists) {
          // If exists, try again with a different random number
          generateUniqueSku()
        } else {
          // Use this SKU
          onChange("sku", baseSku)
          setSkuExists(false)
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.sku
            return newErrors
          })
        }
      }
    } catch (error) {
      console.error("Error generating SKU:", error)
    } finally {
      setIsGeneratingSku(false)
    }
  }

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm() && !skuExists) {
      onSubmit()
    }
  }

  // Check SKU when it changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newProductData.sku) {
        checkSkuExists(newProductData.sku)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [newProductData.sku])

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={newProductData.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Enter product name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <div className="flex gap-2">
            <Input
              id="sku"
              value={newProductData.sku}
              onChange={(e) => onChange("sku", e.target.value)}
              placeholder="Enter SKU"
              className={errors.sku || skuExists ? "border-red-500" : ""}
            />
            <Button type="button" variant="outline" size="sm" onClick={generateUniqueSku} disabled={isGeneratingSku}>
              {isGeneratingSku ? "Generating..." : "Generate"}
            </Button>
          </div>
          {errors.sku && <p className="text-xs text-red-500">{errors.sku}</p>}
          {skuExists && !errors.sku && <p className="text-xs text-red-500">This SKU already exists</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={newProductData.category} onValueChange={(value) => onChange("category", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category._id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <Select value={newProductData.supplierId} onValueChange={(value) => onChange("supplierId", value)}>
            <SelectTrigger className={errors.supplierId ? "border-red-500" : ""}>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.supplierId && <p className="text-xs text-red-500">{errors.supplierId}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cost">Cost Price</Label>
          <Input
            id="cost"
            type="number"
            value={newProductData.cost}
            onChange={(e) => onChange("cost", Number.parseFloat(e.target.value) || 0)}
            placeholder="Enter cost price"
            className={errors.cost ? "border-red-500" : ""}
          />
          {errors.cost && <p className="text-xs text-red-500">{errors.cost}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sellingPrice">Selling Price</Label>
          <Input
            id="sellingPrice"
            type="number"
            value={newProductData.sellingPrice}
            onChange={(e) => onChange("sellingPrice", Number.parseFloat(e.target.value) || 0)}
            placeholder="Enter selling price"
            className={errors.sellingPrice ? "border-red-500" : ""}
          />
          {errors.sellingPrice && <p className="text-xs text-red-500">{errors.sellingPrice}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <Input
            id="taxRate"
            type="number"
            value={newProductData.taxRate}
            onChange={(e) => onChange("taxRate", Number.parseFloat(e.target.value) || 0)}
            placeholder="Enter tax rate"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reorderLevel">Reorder Level</Label>
          <Input
            id="reorderLevel"
            type="number"
            value={newProductData.reorderLevel}
            onChange={(e) => onChange("reorderLevel", Number.parseInt(e.target.value) || 0)}
            placeholder="Enter reorder level"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Purchase Price (with tax)</Label>
        <div className="rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
          {calculatePurchasePrice(newProductData.cost, newProductData.taxRate).toFixed(2)}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || skuExists}>
          {isSubmitting ? "Adding..." : "Add Product"}
        </Button>
      </div>
    </div>
  )
}
