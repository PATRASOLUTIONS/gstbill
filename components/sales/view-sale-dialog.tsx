"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/utils/format-currency"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ViewSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: string | null
}

interface SaleItem {
  product: string
  productName: string
  quantity: number
  price: number
  taxRate: number
  taxAmount: number
  total: number
}

interface Customer {
  _id: string
  name: string
  email: string
  contact: string
  address?: string
}

interface Sale {
  _id: string
  customer: Customer
  saleDate: string
  items: SaleItem[]
  subtotal: number
  taxTotal: number
  total: number
  status: string
  paymentStatus: string
  notes?: string
  createdAt: string
  updatedAt: string
  invoiceId?: string
  invoiceNumber?: string
  paymentDetails?: {
    amount: number
    method: string
    reference?: string
    notes?: string
    date: string
  }
}

export function ViewSaleDialog({ open, onOpenChange, saleId }: ViewSaleDialogProps) {
  const { toast } = useToast()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && saleId) {
      console.log("ViewSaleDialog opened with saleId:", saleId)
      fetchSaleDetails()
    } else {
      // Reset state when dialog closes
      setSale(null)
    }
  }, [open, saleId])

  const fetchSaleDetails = async () => {
    if (!saleId) return

    try {
      setLoading(true)
      console.log("Fetching sale details for:", saleId)
      const response = await fetch(`/api/sales/${saleId}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to fetch sale details")
      }

      const data = await response.json()
      console.log("Sale details received:", data)
      setSale(data.sale)
    } catch (error) {
      console.error("Error fetching sale details:", error)
      toast({
        title: "Error",
        description: "Failed to load sale details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!sale) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>No sale data available.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Sale Details</DialogTitle>
          <DialogDescription>
            Sale #{sale._id.substring(0, 8)} - {formatDate(sale.saleDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Customer Information</h3>
              <p className="mt-1 font-medium">{sale.customer?.name}</p>
              <p className="text-sm">{sale.customer?.email}</p>
              <p className="text-sm">{sale.customer?.contact}</p>
              {sale.customer?.address && <p className="text-sm">{sale.customer.address}</p>}
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Sale Information</h3>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge
                  variant={
                    sale.status === "Completed" ? "success" : sale.status === "Cancelled" ? "destructive" : "outline"
                  }
                >
                  {sale.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Payment:</span>
                <Badge
                  variant={
                    sale.paymentStatus === "Paid"
                      ? "success"
                      : sale.paymentStatus === "Partial"
                        ? "outline"
                        : "destructive"
                  }
                >
                  {sale.paymentStatus}
                </Badge>
              </div>
              {sale.invoiceNumber && (
                <p className="mt-1">
                  <span className="font-medium">Invoice:</span> {sale.invoiceNumber}
                </p>
              )}
              {sale.paymentDetails && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Payment Details:</p>
                  <p className="text-sm">
                    <span className="font-medium">Method:</span> {sale.paymentDetails.method}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Amount:</span> {formatCurrency(sale.paymentDetails.amount)}
                  </p>
                  {sale.paymentDetails.reference && (
                    <p className="text-sm">
                      <span className="font-medium">Reference:</span> {sale.paymentDetails.reference}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Date:</span> {formatDate(sale.paymentDetails.date)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Items</h3>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left text-sm font-medium">Product</th>
                    <th className="p-2 text-right text-sm font-medium">Quantity</th>
                    <th className="p-2 text-right text-sm font-medium">Price</th>
                    <th className="p-2 text-right text-sm font-medium">Tax</th>
                    <th className="p-2 text-right text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 text-sm">{item.productName}</td>
                      <td className="p-2 text-right text-sm">{item.quantity}</td>
                      <td className="p-2 text-right text-sm">{formatCurrency(item.price)}</td>
                      <td className="p-2 text-right text-sm">
                        {item.taxRate}% ({formatCurrency(item.taxAmount)})
                      </td>
                      <td className="p-2 text-right text-sm">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tax:</span>
              <span>{formatCurrency(sale.taxTotal)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {sale.notes && (
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">Notes</h3>
              <p className="text-sm">{sale.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

