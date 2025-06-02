"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PurchaseOrder {
  _id?: string
  poNumber: string
  supplierName: string
  totalAmount: number
  paidAmount: number
  paymentStatus: string
}

interface RecordPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: PurchaseOrder | null
  paymentAmount: number
  setPaymentAmount: (amount: number) => void
  onSavePayment: () => void
  isSubmitting: boolean
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  purchase,
  paymentAmount,
  setPaymentAmount,
  onSavePayment,
  isSubmitting,
}: RecordPaymentDialogProps) {
  // Payment status badge variant helper
  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Unpaid":
        return "destructive"
      case "Partially Paid":
        return "warning"
      case "Paid":
        return "success"
      default:
        return "default"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {purchase?.poNumber} - {purchase?.supplierName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold">₹{purchase?.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Already Paid</p>
              <p className="text-lg font-semibold">₹{purchase?.paidAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
              <Badge variant={getPaymentStatusBadgeVariant(purchase?.paymentStatus || "") as any} className="mt-1">
                {purchase?.paymentStatus}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Balance Due</p>
              <p className="text-lg font-semibold">
                ₹{((purchase?.totalAmount || 0) - (purchase?.paidAmount || 0)).toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Payment Amount</Label>
            <Input
              id="payment-amount"
              type="number"
              placeholder="Enter payment amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number.parseFloat(e.target.value) || 0)}
            />
            {paymentAmount > (purchase?.totalAmount || 0) - (purchase?.paidAmount || 0) && (
              <p className="text-xs text-orange-500">
                Payment amount exceeds the balance due. The excess will be recorded as a credit.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSavePayment} disabled={isSubmitting || paymentAmount <= 0}>
            {isSubmitting ? "Saving..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
