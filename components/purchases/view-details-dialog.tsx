"use client"

import { File, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PurchaseItem {
  productName: string
  productSku: string
  quantity: number
  unitPrice: number
  taxRate: number
  totalPrice: number
}

interface Attachment {
  fileName: string
  fileUrl: string
  fileType: string
  uploadedAt: string
}

interface PurchaseOrder {
  poNumber: string
  supplierName: string
  status: string
  orderDate: string
  expectedDeliveryDate: string | null
  paymentStatus: string
  totalAmount: number
  notes: string | null
  items: PurchaseItem[]
  attachments?: Attachment[]
}

interface ViewDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: PurchaseOrder | null
}

export function ViewDetailsDialog({ open, onOpenChange, purchase }: ViewDetailsDialogProps) {
  // Status badge variant helper
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Draft":
        return "secondary"
      case "Ordered":
        return "warning"
      case "Partially Received":
        return "default"
      case "Received":
        return "success"
      case "Cancelled":
        return "destructive"
      default:
        return "default"
    }
  }

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
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Purchase Order Details</DialogTitle>
          <DialogDescription>
            {purchase?.poNumber} - {purchase?.supplierName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {purchase && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                  <p className="text-lg font-semibold">{purchase.supplierName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(purchase.status) as any} className="mt-1">
                    {purchase.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                  <p className="text-base">{purchase.orderDate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expected Delivery</p>
                  <p className="text-base">{purchase.expectedDeliveryDate || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                  <Badge variant={getPaymentStatusBadgeVariant(purchase.paymentStatus) as any} className="mt-1">
                    {purchase.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-semibold">₹{purchase.totalAmount.toLocaleString()}</p>
                </div>
                {purchase.notes && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-base mt-1">{purchase.notes}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Items</p>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Tax Rate</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchase.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>{item.productSku}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell>{item.taxRate}%</TableCell>
                          <TableCell>₹{item.totalPrice.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={5} className="text-right font-bold">
                          Total:
                        </TableCell>
                        <TableCell className="font-bold">₹{purchase.totalAmount.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {purchase.attachments && purchase.attachments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Attachments</p>
                  <div className="space-y-2">
                    {purchase.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between border p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{attachment.fileName}</p>
                        </div>
                        <a
                          href={attachment.fileUrl}
                          download={attachment.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
