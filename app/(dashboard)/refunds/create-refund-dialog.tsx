"use client"

import { useState, useEffect } from "react"
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
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import type { Sale } from "@/types/sale"

const formSchema = z.object({
  saleId: z.string().min(1, "Sale is required"),
  reason: z.string().min(3, "Reason is required"),
  amount: z.string().refine(
    (val) => {
      const num = Number.parseFloat(val)
      return !isNaN(num) && num > 0
    },
    { message: "Amount must be a positive number" },
  ),
})

type FormValues = z.infer<typeof formSchema>

interface CreateRefundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefundCreated: () => void
}

export function CreateRefundDialog({ open, onOpenChange, onRefundCreated }: CreateRefundDialogProps) {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingSales, setFetchingSales] = useState(true)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      saleId: "",
      reason: "",
      amount: "",
    },
  })

  useEffect(() => {
    const fetchSales = async () => {
      setFetchingSales(true)
      try {
        const response = await fetch("/api/sales?status=Completed")
        const data = await response.json()
        setSales(data.sales)
      } catch (error) {
        console.error("Error fetching sales:", error)
      } finally {
        setFetchingSales(false)
      }
    }

    if (open) {
      fetchSales()
    }
  }, [open])

  const handleSaleChange = (saleId: string) => {
    const sale = sales.find((s) => s._id === saleId)
    setSelectedSale(sale || null)

    if (sale) {
      form.setValue("amount", sale.total.toString())
    } else {
      form.setValue("amount", "")
    }
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const response = await fetch("/api/refunds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saleId: values.saleId,
          reason: values.reason,
          amount: Number.parseFloat(values.amount),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create refund")
      }

      form.reset()
      onRefundCreated()
    } catch (error) {
      console.error("Error creating refund:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Refund</DialogTitle>
          <DialogDescription>Create a refund for a completed sale.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="saleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sale</FormLabel>
                  <Select
                    disabled={fetchingSales}
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleSaleChange(value)
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sale" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fetchingSales ? (
                        <div className="flex justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        sales.map((sale) => (
                          <SelectItem key={sale._id} value={sale._id}>
                            {sale.saleNumber} - ${sale.total.toFixed(2)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedSale && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p>
                  <strong>Customer:</strong> {selectedSale.customerName}
                </p>
                <p>
                  <strong>Sale Date:</strong> {new Date(selectedSale.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Total:</strong> ${selectedSale.total.toFixed(2)}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Refund</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Explain the reason for this refund" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Refund
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
