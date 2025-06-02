"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import type { Product } from "@/types"
import { updateProduct } from "@/lib/api/products"
import { useRouter } from "next/navigation"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  category: z.string().min(2, {
    message: "Category must be at least 2 characters.",
  }),
  quantity: z.coerce.number().min(0, {
    message: "Quantity must be at least 0.",
  }),
  cost: z.coerce.number().min(0, {
    message: "Cost must be at least 0.",
  }),
  sellingPrice: z.coerce.number().min(0, {
    message: "Selling price must be at least 0.",
  }),
  purchasePrice: z.string().min(1, {
    message: "Purchase price is required.",
  }),
  supplier: z.string().min(2, {
    message: "Supplier must be at least 2 characters.",
  }),
  reorderLevel: z.coerce.number().min(0, {
    message: "Reorder level must be at least 0.",
  }),
})

export function EditProductDialog({ product }: { product: Product }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product.name,
      description: product.description,
      category: product.category,
      quantity: product.quantity,
      cost: product.cost,
      sellingPrice: product.sellingPrice || product.cost * 1.18,
      purchasePrice: product.purchasePrice,
      supplier: product.supplier,
      reorderLevel: product.reorderLevel,
    },
  })

  // Watch for changes in cost and selling price
  const cost = form.watch("cost")
  const sellingPrice = form.watch("sellingPrice")

  // Update selling price when cost changes
  const handleCostChange = (value: number) => {
    const newSellingPrice = Number.parseFloat((value * 1.18).toFixed(2))
    form.setValue("sellingPrice", newSellingPrice)
  }

  // Update cost when selling price changes
  const handleSellingPriceChange = (value: number) => {
    const newCost = Number.parseFloat((value / 1.18).toFixed(2))
    form.setValue("cost", newCost)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updateProduct(product.id, values)
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      })
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <DropdownMenuSeparator />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="w-full justify-start">
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Make changes to the product here. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Product description" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Quantity" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reorderLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Level</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Reorder level" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Cost price"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number.parseFloat(e.target.value))
                            handleCostChange(Number.parseFloat(e.target.value))
                          }}
                        />
                      </FormControl>
                      <FormDescription>This will automatically update the selling price (cost + 18%)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Selling price"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number.parseFloat(e.target.value))
                            handleSellingPriceChange(Number.parseFloat(e.target.value))
                          }}
                        />
                      </FormControl>
                      <FormDescription>Editing this will recalculate the cost price</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price</FormLabel>
                      <FormControl>
                        <Input placeholder="Purchase price" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Input placeholder="Supplier" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
