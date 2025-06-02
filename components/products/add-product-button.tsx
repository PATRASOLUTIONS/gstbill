"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function AddProductButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    quantity: 0,
    cost: 0,
    sellingPrice: 0,
    purchasePrice: 0,
    reorderLevel: 10,
    tax: 0,
    location: "Warehouse A",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "cost") {
      const cost = Number.parseFloat(value)
      const sellingPrice = Number.parseFloat((cost * 1.18).toFixed(2))
      setFormData({
        ...formData,
        [name]: cost,
        sellingPrice,
      })
    } else if (name === "sellingPrice") {
      const sellingPrice = Number.parseFloat(value)
      const cost = Number.parseFloat((sellingPrice / 1.18).toFixed(2))
      setFormData({
        ...formData,
        [name]: sellingPrice,
        cost,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          lastModifiedFrom: "products",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add product")
      }

      toast({
        title: "Product added",
        description: "The product has been added successfully.",
      })
      setOpen(false)
      setFormData({
        name: "",
        sku: "",
        description: "",
        category: "",
        quantity: 0,
        cost: 0,
        sellingPrice: 0,
        purchasePrice: 0,
        reorderLevel: 10,
        tax: 0,
        location: "Warehouse A",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>Add a new product to your inventory. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Product name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="SKU" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Category"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Location"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Product description"
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity.toString()}
                onChange={handleInputChange}
                placeholder="Quantity"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                value={formData.reorderLevel.toString()}
                onChange={handleInputChange}
                placeholder="Reorder level"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost Price</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                value={formData.cost.toString()}
                onChange={handleInputChange}
                placeholder="Cost price"
                required
              />
              <p className="text-sm text-muted-foreground">
                This will automatically update the selling price (cost + 18%)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price</Label>
              <Input
                id="sellingPrice"
                name="sellingPrice"
                type="number"
                value={formData.sellingPrice.toString()}
                onChange={handleInputChange}
                placeholder="Selling price"
                required
              />
              <p className="text-sm text-muted-foreground">Editing this will recalculate the cost price</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input
                id="purchasePrice"
                name="purchasePrice"
                type="number"
                value={formData.purchasePrice.toString()}
                onChange={handleInputChange}
                placeholder="Purchase price"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax">Tax (%)</Label>
              <Input
                id="tax"
                name="tax"
                type="number"
                value={formData.tax.toString()}
                onChange={handleInputChange}
                placeholder="Tax percentage"
                required
              />
            </div>
          </div>
          <Button type="submit">Save Product</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
