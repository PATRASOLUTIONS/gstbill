"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { formatCurrency } from "@/utils/format-currency"
import { useToast } from "@/components/ui/use-toast"

export function ViewRefundDetailsDialog({ open, onOpenChange, refund, onRefresh }) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [actionType, setActionType] = useState("")

  // Enhance the handleStatusChange function with better error handling
  const handleStatusChange = async (newStatus) => {
    try {
      setIsLoading(true)
      setActionType(newStatus)

      if (!refund || !refund._id) {
        throw new Error("Refund information is missing")
      }

      const response = await fetch(`/api/refunds/${refund._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `Failed to ${newStatus} refund: ${response.status}`)
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: `Refund ${newStatus} successfully`,
      })
      onRefresh()
      onOpenChange(false)
    } catch (error) {
      console.error(`Error ${newStatus} refund:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${newStatus} refund`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setActionType("")
    }
  }

  // Add validation before status change
  const validateStatusChange = (currentStatus, newStatus) => {
    // Prevent invalid status transitions
    const validTransitions = {
      pending: ["approved", "rejected"],
      approved: ["completed", "rejected"],
      rejected: [],
      completed: [],
    }

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      toast({
        title: "Invalid Action",
        description: `Cannot change status from ${currentStatus} to ${newStatus}`,
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Completed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Refund Details</DialogTitle>
          <DialogDescription>View details for refund #{refund.refundNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium">Refund Number</h3>
              <p className="text-sm">{refund.refundNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Status</h3>
              <p className="text-sm">{getStatusBadge(refund.status)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Type</h3>
              <p className="text-sm">{refund.type === "customer" ? "Customer Refund" : "Supplier Refund"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Amount</h3>
              <p className="text-sm">{formatCurrency(refund.amount)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Date</h3>
              <p className="text-sm">{new Date(refund.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Reference</h3>
              <p className="text-sm">
                {refund.type === "customer" && refund.sale
                  ? `Sale #${refund.sale.saleNumber || "N/A"}`
                  : refund.type === "supplier" && refund.purchase
                    ? `Purchase #${refund.purchase.purchaseNumber || "N/A"}`
                    : "N/A"}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium">Reason</h3>
            <p className="text-sm">{refund.reason}</p>
          </div>

          {refund.notes && (
            <div>
              <h3 className="text-sm font-medium">Notes</h3>
              <p className="text-sm">{refund.notes}</p>
            </div>
          )}

          {refund.type === "customer" && refund.customer && (
            <div>
              <h3 className="text-sm font-medium">Customer</h3>
              <p className="text-sm">{refund.customer.name || "Unknown"}</p>
            </div>
          )}

          {refund.type === "supplier" && refund.supplier && (
            <div>
              <h3 className="text-sm font-medium">Supplier</h3>
              <p className="text-sm">{refund.supplier.name || "Unknown"}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {refund.status === "pending" && (
            <>
              <Button
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
                onClick={() => {
                  if (validateStatusChange(refund.status, "rejected")) {
                    handleStatusChange("rejected")
                  }
                }}
                disabled={isLoading}
              >
                {isLoading && actionType === "rejected" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject Refund"
                )}
              </Button>
              <Button
                variant="outline"
                className="border-green-500 text-green-500 hover:bg-green-50"
                onClick={() => {
                  if (validateStatusChange(refund.status, "approved")) {
                    handleStatusChange("approved")
                  }
                }}
                disabled={isLoading}
              >
                {isLoading && actionType === "approved" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve Refund"
                )}
              </Button>
            </>
          )}

          {refund.status === "approved" && (
            <Button
              onClick={() => {
                if (validateStatusChange(refund.status, "completed")) {
                  handleStatusChange("completed")
                }
              }}
              disabled={isLoading}
            >
              {isLoading && actionType === "completed" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                "Mark as Completed"
              )}
            </Button>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

