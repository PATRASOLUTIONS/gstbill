"use client"

import { Eye, Edit, CheckCircle, DollarSign, XCircle, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface PurchaseOrder {
  _id?: string
  id?: string
  status: string
  paymentStatus: string
  [key: string]: any
}

interface PurchaseActionsProps {
  purchase: PurchaseOrder
  onViewDetails: (purchase: PurchaseOrder) => void
  onEditOrder: (purchase: PurchaseOrder) => void
  onReceiveItems: (purchase: PurchaseOrder) => void
  onRecordPayment: (purchase: PurchaseOrder) => void
  onCancelOrder: (purchase: PurchaseOrder) => void
}

export function PurchaseActions({
  purchase,
  onViewDetails,
  onEditOrder,
  onReceiveItems,
  onRecordPayment,
  onCancelOrder,
}: PurchaseActionsProps) {
  // Check if the purchase can be edited (only Draft or Ordered statuses)
  const canBeEdited = purchase.status === "Draft" || purchase.status === "Ordered"

  // Check if payment actions are available (not for Paid status)
  const canRecordPayment = purchase.paymentStatus !== "Paid"

  // Check if the purchase can be canceled (not for Paid status)
  const canBeCanceled = purchase.paymentStatus !== "Paid"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onViewDetails(purchase)}>
          <Eye className="h-4 w-4 mr-2" />
          View details
        </DropdownMenuItem>

        {canBeEdited && (
          <DropdownMenuItem onClick={() => onEditOrder(purchase)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit order
          </DropdownMenuItem>
        )}

        {purchase.status !== "Received" && (
          <DropdownMenuItem onClick={() => onReceiveItems(purchase)}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Receive items
          </DropdownMenuItem>
        )}

        {canRecordPayment && (
          <DropdownMenuItem onClick={() => onRecordPayment(purchase)}>
            <DollarSign className="h-4 w-4 mr-2" />
            Record payment
          </DropdownMenuItem>
        )}

        {canBeCanceled && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => onCancelOrder(purchase)}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel order
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
