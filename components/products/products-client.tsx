"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductsTable } from "@/components/products/products-table"
import { AddProductDialog } from "@/components/products/add-product-dialog"

export function ProductsClient() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setOpen(true)}>Add Product</Button>
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="order-now">Order Now</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <ProductsTable />
        </TabsContent>
        <TabsContent value="order-now" className="space-y-4">
          <ProductsTable filter="order-now" />
        </TabsContent>
        <TabsContent value="critical" className="space-y-4">
          <ProductsTable filter="critical" />
        </TabsContent>
        <TabsContent value="low-stock" className="space-y-4">
          <ProductsTable filter="low-stock" />
        </TabsContent>
        <TabsContent value="out-of-stock" className="space-y-4">
          <ProductsTable filter="out-of-stock" />
        </TabsContent>
      </Tabs>
      <AddProductDialog open={open} setOpen={setOpen} />
    </div>
  )
}

