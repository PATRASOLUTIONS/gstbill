"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

type DeletePurchaseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseId: string
  onDeleted?: () => void
}

export function DeletePurchaseDialog({ open, onOpenChange, purchaseId, onDeleted }: DeletePurchaseDialogProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!purchaseId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete purchase order")
      }

      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
      })

      onDeleted?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting purchase order:", error)
      toast({
        title: "Error",
        description: "Failed to delete purchase order",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the purchase order and any associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

