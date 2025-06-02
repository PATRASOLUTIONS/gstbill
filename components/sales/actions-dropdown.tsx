"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eye, Edit, CreditCard, CheckCircle2, MoreHorizontal, Trash2 } from "lucide-react"
import { InvoiceGenerator } from "./invoice-generator"

interface Sale {
  _id: string
  status: string
  paymentStatus: string
  invoiceId?: string
  total: number
}

interface ActionsDropdownProps {
  sale: Sale
  onViewDetails: (saleId: string) => void
  onEditSale: (saleId: string) => void
  onRecordPayment: (saleId: string, total: number) => void
  onMarkCompleted: (saleId: string) => void
  onDeleteSale: (saleId: string) => void
  onInvoiceCreated?: () => void
  isSubmitting?: boolean
}

export function ActionsDropdown({
  sale,
  onViewDetails,
  onEditSale,
  onRecordPayment,
  onMarkCompleted,
  onDeleteSale,
  onInvoiceCreated,
  isSubmitting = false,
}: ActionsDropdownProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleInvoiceCreated = (invoiceId: string, invoiceNumber: string) => {
    // Refresh the parent component
    if (onInvoiceCreated) {
      onInvoiceCreated()
    }

    // Close the dropdown
    setIsOpen(false)

    // Navigate to the invoice after a short delay
    setTimeout(() => {
      router.push(`/invoices/${invoiceId}`)
    }, 1000)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            onViewDetails(sale._id)
            setIsOpen(false)
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>

        {sale.status !== "Cancelled" && sale.status !== "Completed" && (
          <DropdownMenuItem
            onClick={() => {
              onEditSale(sale._id)
              setIsOpen(false)
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Sale
          </DropdownMenuItem>
        )}

        {sale.paymentStatus !== "Paid" && sale.status !== "Cancelled" && (
          <DropdownMenuItem
            onClick={() => {
              onRecordPayment(sale._id, sale.total)
              setIsOpen(false)
            }}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Record Payment
          </DropdownMenuItem>
        )}

        {sale.status === "Pending" && (
          <DropdownMenuItem
            onClick={() => {
              onMarkCompleted(sale._id)
              setIsOpen(false)
            }}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark as Completed
          </DropdownMenuItem>
        )}

        {!sale.invoiceId && sale.status !== "Cancelled" && (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <InvoiceGenerator
              saleId={sale._id}
              variant="ghost"
              size="sm"
              className="w-full justify-start p-0 font-normal"
              onSuccess={handleInvoiceCreated}
            />
          </DropdownMenuItem>
        )}

        {sale.status !== "Cancelled" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                onDeleteSale(sale._id)
                setIsOpen(false)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cancel Sale
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
