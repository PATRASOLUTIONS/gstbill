"use client"

import { useState, useCallback } from "react"
import { MoreHorizontal, Download, Edit, Trash, Eye, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
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

interface InvoiceActionsProps {
  invoice: {
    id: string
    invoiceNumber: string
  }
}

// Add a new server action to update the invoice status
async function markAsPaid(invoiceId: string) {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "paid" }),
    })

    if (!response.ok) {
      throw new Error("Failed to update invoice status")
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating invoice status:", error)
    return { success: false, error }
  }
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleView = () => {
    router.push(`/invoices/${invoice.id}`)
  }

  const handleEdit = () => {
    router.push(`/invoices/${invoice.id}/edit`)
  }

  const handleDownload = useCallback(async () => {
    setIsLoading(true)

    const toastId = toast({
      title: "Processing",
      description: "Generating invoice PDF...",
    })

    try {
      console.log(`Attempting to download invoice ${invoice.id}`)

      // Method 1: Direct window.open approach (simplest and most reliable)
      window.open(`/api/invoice/${invoice.id}/download`, "_blank")

      toast({
        id: toastId,
        title: "Download Initiated",
        description: "Invoice should open in a new tab or download automatically",
      })

      // If window.open doesn't trigger a download, try fetch as fallback
      try {
        const response = await fetch(`/api/invoice/${invoice.id}/download`)

        if (!response.ok) {
          console.error(`Fetch fallback failed with status ${response.status}`)
          // Continue with window.open approach, don't throw here
        } else {
          console.log("Fetch successful, trying blob download")
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)

          const a = document.createElement("a")
          a.href = url
          a.download = `Invoice-${invoice.invoiceNumber || invoice.id}.pdf`
          document.body.appendChild(a)
          a.click()

          // Clean up
          setTimeout(() => {
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
          }, 100)

          console.log("Blob download completed")
        }
      } catch (fetchError) {
        console.error("Fetch fallback failed:", fetchError)
        // Continue with window.open approach, which was already tried
      }
    } catch (error) {
      console.error("Error downloading invoice:", error)

      toast({
        id: toastId,
        title: "Download Failed",
        description: "Please check your browser's download settings or try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [invoice.id, invoice.invoiceNumber])

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete invoice")
      }

      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      })

      router.refresh()
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete invoice",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            {isLoading ? "Downloading..." : "Download"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              const result = await markAsPaid(invoice.id)
              if (result.success) {
                toast({
                  title: "Payment recorded",
                  description: "Invoice has been marked as paid",
                })
                router.refresh()
              } else {
                toast({
                  title: "Error",
                  description: "Failed to record payment",
                  variant: "destructive",
                })
              }
            }}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Record Payment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
