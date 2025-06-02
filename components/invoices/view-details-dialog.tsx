"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Download, Check, Loader2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ViewDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string | null
  onDownload: (invoiceId: string) => Promise<void>
  onMarkAsPaid: (invoiceId: string) => Promise<void>
}

interface InvoiceItem {
  productId: string
  productName: string
  quantity: number
  price: number
  tax: number
  total: number
}

interface InvoiceDetails {
  _id: string
  number: string
  date: string
  dueDate: string
  customerName: string
  customerId: string
  items: InvoiceItem[]
  subtotal: number
  taxTotal: number
  total: number
  status: string
  paymentMethod: string
  notes: string
  isGst: boolean
}

export function ViewDetailsDialog({ open, onOpenChange, invoiceId, onDownload, onMarkAsPaid }: ViewDetailsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoiceDetails(invoiceId)
      // Reset download states when dialog opens
      setIsDownloading(false)
      setDownloadProgress(null)
      setDownloadError(null)
      setRetryCount(0)
    } else {
      setInvoice(null)
    }
  }, [open, invoiceId])

  const fetchInvoiceDetails = async (id: string) => {
    setLoading(true)
    try {
      // Fetch invoice details from the API
      const response = await fetch(`/api/invoice?id=${id}`)

      if (!response.ok) {
        throw new Error("Failed to fetch invoice details")
      }

      const data = await response.json()
      setInvoice(data)
    } catch (error) {
      console.error("Error fetching invoice details:", error)
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "success"
      case "pending":
        return "warning"
      case "overdue":
        return "destructive"
      case "cancelled":
        return "outline"
      case "draft":
        return "secondary"
      default:
        return "default"
    }
  }

  const formatPaymentMethod = (method: string) => {
    if (!method) return ""
    return method
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP")
    } catch (e) {
      return dateString
    }
  }

  const handleMarkAsPaid = async () => {
    if (!invoiceId) return
    setActionLoading("markAsPaid")
    try {
      await onMarkAsPaid(invoiceId)
      // Update the local invoice status
      if (invoice) {
        setInvoice({
          ...invoice,
          status: "paid",
        })
      }
    } finally {
      setActionLoading(null)
    }
  }

  const downloadInvoice = useCallback(async () => {
    if (!invoice?._id) return

    setIsDownloading(true)
    setDownloadProgress("Preparing invoice...")
    setDownloadError(null)

    try {
      // Add a small delay to ensure UI updates
      await new Promise((resolve) => setTimeout(resolve, 300))

      setDownloadProgress("Requesting PDF from server...")

      // Use the invoice ID to request the PDF with proper headers
      const response = await fetch(`/api/invoice/${invoice._id}/pdf`, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        // Add a cache-busting query parameter
        cache: "no-store",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PDF generation error:", errorText)
        throw new Error(`Failed to generate PDF: ${response.status} ${response.statusText}`)
      }

      setDownloadProgress("Processing PDF data...")

      // Get the PDF as a blob
      const blob = await response.blob()

      // Verify the blob has content and is a PDF
      if (!blob || blob.size === 0) {
        throw new Error("Generated PDF is empty")
      }

      if (blob.type !== "application/pdf" && blob.type !== "") {
        console.warn("Unexpected content type:", blob.type)
      }

      setDownloadProgress("Starting download...")

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }))
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `Invoice-${invoice.number || "download"}.pdf`

      // Append to body, click, and clean up
      document.body.appendChild(a)
      a.click()

      // Small delay before cleanup to ensure download starts
      await new Promise((resolve) => setTimeout(resolve, 100))

      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setDownloadProgress("Download complete!")

      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
        variant: "default",
      })

      // Clear the progress message after a short delay
      setTimeout(() => {
        setDownloadProgress(null)
      }, 2000)
    } catch (error) {
      console.error("Error downloading invoice:", error)

      let errorMessage = error instanceof Error ? error.message : "Failed to download invoice"

      // Add more helpful information for common errors
      if (errorMessage.includes("map") && errorMessage.includes("not a function")) {
        errorMessage =
          "There was a problem processing the invoice data. Please try the 'Retry' button or contact support."
      } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        errorMessage = "Network error while downloading. Please check your connection and try again."
      }

      setDownloadError(errorMessage)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })

      // Log additional details to console for debugging
      if (invoice) {
        console.log("Invoice ID with error:", invoice._id)
        console.log("Invoice number with error:", invoice.number)
      }
    } finally {
      setIsDownloading(false)
    }
  }, [invoice, toast])

  // Retry download with exponential backoff
  const retryDownload = useCallback(async () => {
    if (retryCount >= 3) {
      toast({
        title: "Error",
        description: "Maximum retry attempts reached. Please try again later.",
        variant: "destructive",
      })
      return
    }

    setRetryCount((prev) => prev + 1)

    // Exponential backoff delay
    const delay = Math.pow(2, retryCount) * 1000
    toast({
      title: "Retrying",
      description: `Retrying download in ${delay / 1000} seconds...`,
      variant: "default",
    })

    await new Promise((resolve) => setTimeout(resolve, delay))
    downloadInvoice()
  }, [downloadInvoice, retryCount, toast])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : invoice ? (
          <>
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle>Invoice {invoice.number}</DialogTitle>
                <Badge variant={getStatusBadgeVariant(invoice.status) as any}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </div>
              <DialogDescription>Created on {formatDate(invoice.date)}</DialogDescription>
            </DialogHeader>

            {downloadError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  {downloadError}
                  <Button
                    variant="link"
                    className="p-0 h-auto ml-2"
                    onClick={retryDownload}
                    disabled={isDownloading || retryCount >= 3}
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm">Customer</h3>
                  <p className="text-sm">{invoice.customerName}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Payment Method</h3>
                  <p className="text-sm">{formatPaymentMethod(invoice.paymentMethod)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Invoice Date</h3>
                  <p className="text-sm">{formatDate(invoice.date)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Due Date</h3>
                  <p className="text-sm">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>

              <Separator className="my-2" />

              <h3 className="font-medium">Items</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No items
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoice.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.tax}%</TableCell>
                          <TableCell className="text-right">₹{item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-end space-y-2 mt-2">
                <div className="flex w-full justify-between md:w-1/2">
                  <span className="text-sm">Subtotal:</span>
                  <span className="text-sm">₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex w-full justify-between md:w-1/2">
                  <span className="text-sm">Tax:</span>
                  <span className="text-sm">₹{invoice.taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex w-full justify-between border-t pt-2 font-bold md:w-1/2">
                  <span>Total:</span>
                  <span>₹{invoice.total.toFixed(2)}</span>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-4">
                  <h3 className="font-medium text-sm">Notes</h3>
                  <p className="text-sm mt-1 text-muted-foreground">{invoice.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={downloadInvoice} disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {downloadProgress || "Downloading..."}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
              {invoice.status !== "paid" && (
                <Button variant="default" onClick={handleMarkAsPaid} disabled={!!actionLoading}>
                  {actionLoading === "markAsPaid" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Mark as Paid
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <div className="text-center py-4">No invoice data available</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
