"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const refundFormSchema = z.object({
  type: z.enum(["customer", "supplier"]),
  referenceId: z.string().min(1, "Reference is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
})

export function CreateRefundDialog({ open, onOpenChange, onSuccess }) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [sales, setSales] = useState([])
  const [purchases, setPurchases] = useState([])
  const [selectedSale, setSelectedSale] = useState(null)
  const [selectedPurchase, setSelectedPurchase] = useState(null)

  const form = useForm({
    resolver: zodResolver(refundFormSchema),
    defaultValues: {
      type: "customer",
      referenceId: "",
      amount: "",
      reason: "",
      notes: "",
    },
  })

  const refundType = form.watch("type")
  const referenceId = form.watch("referenceId")

  useEffect(() => {
    if (open) {
      fetchCustomersAndSuppliers()
      fetchSalesAndPurchases()
    }
  }, [open])

  useEffect(() => {
    // Reset reference ID when type changes
    form.setValue("referenceId", "")
    form.setValue("amount", "")
    setSelectedSale(null)
    setSelectedPurchase(null)
  }, [refundType, form])

  useEffect(() => {
    // Set amount based on selected sale or purchase
    if (refundType === "customer" && selectedSale) {
      const remainingAmount = selectedSale.totalAmount - (selectedSale.paidAmount || 0)
      form.setValue("amount", remainingAmount.toString())
    } else if (refundType === "supplier" && selectedPurchase) {
      const remainingAmount = selectedPurchase.totalAmount - (selectedPurchase.paidAmount || 0)
      form.setValue("amount", remainingAmount.toString())
    }
  }, [selectedSale, selectedPurchase, refundType, form])

  const fetchCustomersAndSuppliers = async () => {
    try {
      const [customersRes, suppliersRes] = await Promise.all([
        fetch("/api/customers?limit=100"),
        fetch("/api/suppliers?limit=100"),
      ])

      const customersData = await customersRes.json()
      const suppliersData = await suppliersRes.json()

      setCustomers(customersData.customers || [])
      setSuppliers(suppliersData.suppliers || [])
    } catch (error) {
      console.error("Error fetching customers and suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to load customers and suppliers",
        variant: "destructive",
      })
    }
  }

  const fetchSalesAndPurchases = async () => {
    try {
      const [salesRes, purchasesRes] = await Promise.all([
        fetch("/api/sales?limit=100"),
        fetch("/api/purchases?limit=100"),
      ])

      const salesData = await salesRes.json()
      const purchasesData = await purchasesRes.json()

      setSales(salesData.sales || [])
      setPurchases(purchasesData.purchases || [])
    } catch (error) {
      console.error("Error fetching sales and purchases:", error)
      toast({
        title: "Error",
        description: "Failed to load sales and purchases",
        variant: "destructive",
      })
    }
  }

  // Enhance the validateForm function with more comprehensive validation
  const validateForm = () => {
    try {
      const result = refundFormSchema.parse(form.getValues())
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          form.setError(err.path[0] as any, {
            message: err.message,
          })
        })
      }
      return false
    }
  }

  // Improve the onSubmit function with better error handling
  const onSubmit = async (data) => {
    try {
      setIsLoading(true)

      // Validate amount against remaining balance
      if (data.type === "customer" && selectedSale) {
        const remainingAmount = selectedSale.totalAmount - (selectedSale.paidAmount || 0)
        if (Number.parseFloat(data.amount) > remainingAmount) {
          form.setError("amount", {
            message: `Amount cannot exceed the remaining balance of ${remainingAmount.toFixed(2)}`,
          })
          return
        }
      } else if (data.type === "supplier" && selectedPurchase) {
        const remainingAmount = selectedPurchase.totalAmount - (selectedPurchase.paidAmount || 0)
        if (Number.parseFloat(data.amount) > remainingAmount) {
          form.setError("amount", {
            message: `Amount cannot exceed the remaining balance of ${remainingAmount.toFixed(2)}`,
          })
          return
        }
      }

      // Format the data for API
      const refundData = {
        ...data,
        amount: Number.parseFloat(data.amount),
        status: "pending",
      }

      // Add reference details based on type
      if (data.type === "customer" && selectedSale) {
        refundData.customer = selectedSale.customer._id || selectedSale.customer
        refundData.sale = selectedSale._id
      } else if (data.type === "supplier" && selectedPurchase) {
        refundData.supplier = selectedPurchase.supplier._id || selectedPurchase.supplier
        refundData.purchase = selectedPurchase._id
      } else {
        throw new Error("Missing reference information")
      }

      const response = await fetch("/api/refunds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(refundData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || `Failed to create refund: ${response.status}`)
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: "Refund created successfully",
      })
      form.reset()
      onSuccess()
    } catch (error) {
      console.error("Error creating refund:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create refund",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Improve the handleSaleSelect function with better error handling
  const handleSaleSelect = async (saleId) => {
    try {
      const sale = sales.find((s) => s._id === saleId)
      setSelectedSale(sale)

      if (sale) {
        // Fetch the latest sale data to ensure we have the most up-to-date information
        const response = await fetch(`/api/sales/${saleId}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Failed to fetch sale details: ${response.status}`)
        }

        const data = await response.json()

        if (!data.sale) {
          throw new Error("Sale data not found")
        }

        setSelectedSale(data.sale)

        // Calculate remaining amount
        const remainingAmount = data.sale.totalAmount - (data.sale.paidAmount || 0)
        form.setValue("amount", remainingAmount.toString())
      }
    } catch (error) {
      console.error("Error fetching sale details:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load sale details",
        variant: "destructive",
      })
    }
  }

  // Improve the handlePurchaseSelect function with better error handling
  const handlePurchaseSelect = async (purchaseId) => {
    try {
      const purchase = purchases.find((p) => p._id === purchaseId)
      setSelectedPurchase(purchase)

      if (purchase) {
        // Fetch the latest purchase data
        const response = await fetch(`/api/purchases/${purchaseId}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Failed to fetch purchase details: ${response.status}`)
        }

        const data = await response.json()

        if (!data.purchase) {
          throw new Error("Purchase data not found")
        }

        setSelectedPurchase(data.purchase)

        // Calculate remaining amount
        const remainingAmount = data.purchase.totalAmount - (data.purchase.paidAmount || 0)
        form.setValue("amount", remainingAmount.toString())
      }
    } catch (error) {
      console.error("Error fetching purchase details:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load purchase details",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Refund</DialogTitle>
          <DialogDescription>Create a new refund for a customer or supplier</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select refund type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="customer">Customer Refund</SelectItem>
                      <SelectItem value="supplier">Supplier Refund</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{refundType === "customer" ? "Sale Reference" : "Purchase Reference"}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      if (refundType === "customer") {
                        handleSaleSelect(value)
                      } else {
                        handlePurchaseSelect(value)
                      }
                    }}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${refundType === "customer" ? "sale" : "purchase"}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {refundType === "customer"
                        ? sales.map((sale) => (
                            <SelectItem key={sale._id} value={sale._id}>
                              {sale.saleNumber} - {sale.customer?.name || "Unknown Customer"}
                            </SelectItem>
                          ))
                        : purchases.map((purchase) => (
                            <SelectItem key={purchase._id} value={purchase._id}>
                              {purchase.purchaseNumber} - {purchase.supplier?.name || "Unknown Supplier"}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {referenceId && (
              <div className="p-3 bg-muted rounded-md text-sm">
                {refundType === "customer" && selectedSale ? (
                  <div className="space-y-1">
                    <p>
                      <strong>Customer:</strong> {selectedSale.customer?.name}
                    </p>
                    <p>
                      <strong>Sale Total:</strong> ${selectedSale.totalAmount?.toFixed(2)}
                    </p>
                    <p>
                      <strong>Paid Amount:</strong> ${selectedSale.paidAmount?.toFixed(2) || "0.00"}
                    </p>
                    <p>
                      <strong>Balance:</strong> $
                      {(selectedSale.totalAmount - (selectedSale.paidAmount || 0)).toFixed(2)}
                    </p>
                  </div>
                ) : refundType === "supplier" && selectedPurchase ? (
                  <div className="space-y-1">
                    <p>
                      <strong>Supplier:</strong> {selectedPurchase.supplier?.name}
                    </p>
                    <p>
                      <strong>Purchase Total:</strong> ${selectedPurchase.totalAmount?.toFixed(2)}
                    </p>
                    <p>
                      <strong>Paid Amount:</strong> ${selectedPurchase.paidAmount?.toFixed(2) || "0.00"}
                    </p>
                    <p>
                      <strong>Balance:</strong> $
                      {(selectedPurchase.totalAmount - (selectedPurchase.paidAmount || 0)).toFixed(2)}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund Amount</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" min="0.01" placeholder="0.00" disabled={isLoading} />
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
                    <Input {...field} placeholder="Enter reason for refund" disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter any additional notes" disabled={isLoading} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Refund"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
