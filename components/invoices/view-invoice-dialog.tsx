"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Download, Printer, Send } from "lucide-react"

interface Invoice {
  _id: string
  invoiceNumber: string
  date: string
  dueDate?: string
  customer: {
    name: string
    email: string
    address?: string
  }
  items?: Array<{
    name: string
    quantity: number
    price: number
  }>
  amount: number
  status: string
  notes?: string
}

interface ViewInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice
}

export function ViewInvoiceDialog({ open, onOpenChange, invoice }: ViewInvoiceDialogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace("₹", "₹")
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const calculateSubtotal = () => {
    if (!invoice.items || invoice.items.length === 0) return 0
    return invoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Implementation for downloading invoice as PDF
    console.log("Download invoice:", invoice.invoiceNumber)
  }

  const handleSend = async () => {
    // Implementation for sending invoice via email
    console.log("Send invoice:", invoice.invoiceNumber)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice #{invoice.invoiceNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">INVOICE</h3>
              <p className="text-muted-foreground">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">Your Company Name</p>
              <p className="text-sm text-muted-foreground">123 Business Street</p>
              <p className="text-sm text-muted-foreground">City, State, ZIP</p>
              <p className="text-sm text-muted-foreground">contact@yourcompany.com</p>
            </div>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Bill To:</h4>
              <p>{invoice.customer.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>
              {invoice.customer.address && <p className="text-sm text-muted-foreground">{invoice.customer.address}</p>}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Date:</span>
                <span>{formatDate(invoice.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span>{invoice.dueDate ? formatDate(invoice.dueDate) : "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="capitalize">{invoice.status}</span>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          {invoice.items && invoice.items.length > 0 ? (
            <div className="border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap">{item.name}</td>
                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground italic">No items listed on this invoice.</p>
          )}

          {/* Invoice Summary */}
          <div className="flex flex-col items-end space-y-2">
            <div className="flex justify-between w-full max-w-xs">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(calculateSubtotal())}</span>
            </div>
            <div className="flex justify-between w-full max-w-xs">
              <span className="text-muted-foreground">Tax:</span>
              <span>{formatCurrency(invoice.amount - calculateSubtotal())}</span>
            </div>
            <div className="flex justify-between w-full max-w-xs font-bold">
              <span>Total:</span>
              <span>{formatCurrency(invoice.amount)}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h4 className="font-medium mb-2">Notes:</h4>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button className="gap-2" onClick={handleSend}>
            <Send className="h-4 w-4" />
            Send Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

