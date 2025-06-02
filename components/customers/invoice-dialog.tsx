"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"

const formSchema = z.object({
  customerId: z.string(),
  dueDate: z.string(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0),
      }),
    )
    .min(1, {
      message: "At least one item is required",
    }),
  notes: z.string().optional(),
})

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

interface InvoiceDialogProps {
  customerId: string
  customerName: string
}

export function InvoiceDialog({ customerId, customerName }: InvoiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [invoiceItems, setInvoiceItems] = useState<
    {
      productId: string
      name: string
      quantity: number
      price: number
    }[]
  >([])
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(1)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: [],
      notes: "",
    },
  })

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products")
        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }
        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error("Error fetching products:", error)
        toast({
          title: "Error",
          description: "Failed to fetch products. Please try again.",
          variant: "destructive",
        })
      }
    }

    if (open) {
      fetchProducts()
    }
  }, [open])

  useEffect(() => {
    form.setValue(
      "items",
      invoiceItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    )
  }, [invoiceItems, form])

  function addItem() {
    if (!selectedProduct || quantity < 1) return

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return

    setInvoiceItems((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        quantity,
        price: product.price,
      },
    ])

    setSelectedProduct("")
    setQuantity(1)
  }

  function removeItem(index: number) {
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to create invoice")
      }

      toast({
        title: "Success",
        description: "Invoice created successfully",
      })

      setOpen(false)
      form.reset()
      setInvoiceItems([])
      router.refresh()
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  const total = invoiceItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Create Invoice</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Invoice for {customerName}</DialogTitle>
          <DialogDescription>Create a new invoice by adding products and setting a due date.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Add Items</h3>
              <div className="flex gap-2">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({formatCurrency(product.price)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
                  className="w-24"
                  placeholder="Qty"
                />
                <Button type="button" onClick={addItem}>
                  Add
                </Button>
              </div>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Invoice Items</h3>
              {invoiceItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items added yet</p>
              ) : (
                <div className="space-y-2">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2">
                    <p className="font-bold">Total</p>
                    <p className="font-bold">{formatCurrency(total)}</p>
                  </div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any additional notes or payment instructions" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={invoiceItems.length === 0}>
                Create Invoice
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

