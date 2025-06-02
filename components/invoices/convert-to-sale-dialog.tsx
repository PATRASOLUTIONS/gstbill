"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ConvertToSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string | null
  invoiceNumber: string | null
  onSuccess: () => void
}

export function ConvertToSaleDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  onSuccess,
}: ConvertToSaleDialogProps) {
  const { toast } = useToast()
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saleId, setSaleId] = useState<string | null>(null)
  const [conversionComplete, setConversionComplete] = useState(false)

  const handleConvert = async () => {
    if (!invoiceId) return

    setIsConverting(true)
    setError(null)
    setSaleId(null)

    try {
      console.log("Converting invoice to sale:", invoiceId)

      const response = await fetch(`/api/invoice/to-sale?invoiceId=${invoiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("Conversion response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to convert invoice to sale")
      }

      if (data.success) {
        setSaleId(data.saleId)
        setConversionComplete(true)
        toast({
          title: "Success",
          description: "Invoice successfully converted to sale",
        })

        // Call the onSuccess callback to refresh the invoices list
        onSuccess()
      } else {
        throw new Error(data.error || "Unknown error occurred")
      }
    } catch (error) {
      console.error("Error converting invoice to sale:", error)
      setError(error instanceof Error ? error.message : "Failed to convert invoice to sale")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to convert invoice to sale",
        variant: "destructive",
      })
    } finally {
      setIsConverting(false)
    }
  }

  const handleClose = () => {
    // Reset state when dialog is closed
    setError(null)
    setSaleId(null)
    setConversionComplete(false)
    onOpenChange(false)
  }

  const viewSale = () => {
    if (saleId) {
      window.location.href = `/sales?highlight=${saleId}`
    }
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert Invoice to Sale</DialogTitle>
          <DialogDescription>
            {conversionComplete
              ? "Invoice has been successfully converted to a sale."
              : `Are you sure you want to convert invoice ${invoiceNumber || ""} to a sale? This will reduce product quantities in inventory.`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {conversionComplete ? (
          <div className="flex items-center justify-center p-4">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          {conversionComplete ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={viewSale}>View Sale</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isConverting}>
                Cancel
              </Button>
              <Button onClick={handleConvert} disabled={isConverting || !invoiceId}>
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  "Convert to Sale"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

