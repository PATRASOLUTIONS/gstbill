"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/utils/format-currency"
import { Printer, FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ViewDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: string | null
}

export function ViewDetailsDialog({ open, onOpenChange, saleId }: ViewDetailsDialogProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [sale, setSale] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && saleId && session) {
      fetchSaleDetails()
    }
  }, [open, saleId, session])

  const fetchSaleDetails = async () => {
    if (!saleId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sales/${saleId}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      const data = await response.json()
      setSale(data)
    } catch (error) {
      console.error("Error fetching sale details:", error)
      setError("Failed to load sale details. Please try again.")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load sale details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open print window. Please check your popup blocker settings.",
        variant: "destructive",
      })
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sale Details - ${sale?.orderId || sale?._id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { font-size: 24px; margin-bottom: 10px; }
          h2 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .status { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 14px; }
          .status-completed { background-color: #dcfce7; color: #166534; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-cancelled { background-color: #fee2e2; color: #b91c1c; }
          .payment-paid { background-color: #dcfce7; color: #166534; }
          .payment-unpaid { background-color: #fee2e2; color: #b91c1c; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Sale Details</h1>
            <p>Order ID: ${sale?.orderId || sale?._id}</p>
            <p>Date: ${new Date(sale?.saleDate || sale?.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <span class="status status-${sale?.status?.toLowerCase()}">
              ${sale?.status}
            </span>
            <span class="status payment-${sale?.paymentStatus === "Paid" ? "paid" : "unpaid"}" style="margin-left: 10px;">
              ${sale?.paymentStatus}
            </span>
          </div>
        </div>

        <h2>Customer Information</h2>
        <p>Name: ${sale?.customer?.name || "Walk-in Customer"}</p>
        <p>Email: ${sale?.customer?.email || "N/A"}</p>
        <p>Phone: ${sale?.customer?.phone || "N/A"}</p>

        <h2>Items</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Tax</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              sale?.items
                ?.map(
                  (item: any) => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.taxAmount)}</td>
                <td>${formatCurrency(item.total)}</td>
              </tr>
            `,
                )
                .join("") || ""
            }
            <tr class="total-row">
              <td colspan="3"></td>
              <td>Subtotal:</td>
              <td>${formatCurrency(sale?.subtotal)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3"></td>
              <td>Tax:</td>
              <td>${formatCurrency(sale?.taxTotal)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3"></td>
              <td>Total:</td>
              <td>${formatCurrency(sale?.total)}</td>
            </tr>
          </tbody>
        </table>

        ${
          sale?.notes
            ? `
          <h2>Notes</h2>
          <p>${sale.notes}</p>
        `
            : ""
        }

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const handleViewInvoice = async () => {
    if (!sale?.invoiceId) {
      toast({
        title: "No Invoice",
        description: "This sale doesn't have an associated invoice yet.",
        variant: "destructive",
      })
      return
    }

    window.open(`/invoices/${sale.invoiceId}`, "_blank")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale Details</DialogTitle>
          <DialogDescription>View detailed information about this sale</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchSaleDetails}>
              Try Again
            </Button>
          </div>
        ) : sale ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">Order #{sale.orderId || sale._id.substring(0, 8)}</h3>
                <p className="text-sm text-muted-foreground">{formatDate(sale.saleDate || sale.createdAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={
                    sale.status === "Completed" ? "success" : sale.status === "Cancelled" ? "destructive" : "secondary"
                  }
                >
                  {sale.status}
                </Badge>
                <Badge variant={sale.paymentStatus === "Paid" ? "success" : "destructive"}>{sale.paymentStatus}</Badge>
              </div>
            </div>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Customer Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p>{sale.customer?.name || "Walk-in Customer"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p>{sale.customer?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p>{sale.customer?.phone || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h4 className="font-medium mb-2">Items</h4>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items?.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.taxAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-col items-end">
                <div className="w-full sm:w-72 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(sale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(sale.taxTotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(sale.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {sale.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm">{sale.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              {sale.invoiceId && (
                <Button onClick={handleViewInvoice}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Invoice
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p>No sale information found.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

