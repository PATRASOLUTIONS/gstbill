"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/format-currency"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface ViewSaleDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: string
}

export function ViewSaleDetailsDialog({ open, onOpenChange, saleId }: ViewSaleDetailsDialogProps) {
  const { toast } = useToast()
  const [sale, setSale] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && saleId) {
      fetchSaleDetails()
    }
  }, [open, saleId])

  const fetchSaleDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sales/${saleId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch sale details")
      }

      const data = await response.json()
      setSale(data)
    } catch (error) {
      console.error("Error fetching sale details:", error)
      setError("Failed to load sale details. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load sale details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !sale) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-center text-red-500">{error || "Failed to load sale details"}</p>
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={fetchSaleDetails}>
                Retry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Sale Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-medium">{sale.orderId || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{new Date(sale.saleDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{sale.customerName || "Walk-in Customer"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{sale.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <p className="font-medium capitalize">{sale.paymentStatus}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-medium">{formatCurrency(sale.total)}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Items</h3>
            <div className="space-y-2">
              {sale.items.map((item: any, index: number) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="flex justify-between">
                    <p className="font-medium">{item.productName}</p>
                    <p className="font-medium">{formatCurrency(item.total)}</p>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <p>
                      {item.quantity} x {formatCurrency(item.price)}
                    </p>
                    <p>Tax: {formatCurrency(item.taxAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Summary</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(sale.taxTotal)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{formatCurrency(sale.discountAmount)}</span>
                </div>
              )}
              {sale.roundOff !== 0 && (
                <div className="flex justify-between">
                  <span>Round Off:</span>
                  <span>{formatCurrency(sale.roundOff)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
            </div>
          </div>

          {sale.notes && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Notes</h3>
              <p className="text-sm">{sale.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

