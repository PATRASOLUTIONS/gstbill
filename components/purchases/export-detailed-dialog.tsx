"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { CSVLink } from "react-csv"
import { Checkbox } from "@/components/ui/checkbox"

interface PurchaseOrder {
  _id?: string
  id?: string
  poNumber: string
  supplierId: string
  supplierName: string
  orderDate: string
  expectedDeliveryDate: string | null
  deliveryDate: string | null
  status: string
  paymentStatus: string
  totalAmount: number
  paidAmount: number
  items: any[]
  notes: string | null
  createdBy: string
  createdAt: string
  [key: string]: any
}

interface ExportDetailedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchases: PurchaseOrder[]
}

export function ExportDetailedDialog({ open, onOpenChange, purchases }: ExportDetailedDialogProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>(new Date(new Date().setMonth(new Date().getMonth() - 1)))
  const [toDate, setToDate] = useState<Date | undefined>(new Date())
  const [includeItems, setIncludeItems] = useState(true)

  // Filter purchases based on date range
  const filteredPurchases = purchases.filter((purchase) => {
    if (!fromDate && !toDate) return true

    const purchaseDate = new Date(purchase.orderDate)

    if (fromDate && toDate) {
      // Set time to start of day for fromDate and end of day for toDate
      const from = new Date(fromDate)
      from.setHours(0, 0, 0, 0)

      const to = new Date(toDate)
      to.setHours(23, 59, 59, 999)

      return purchaseDate >= from && purchaseDate <= to
    }

    if (fromDate && !toDate) {
      const from = new Date(fromDate)
      from.setHours(0, 0, 0, 0)
      return purchaseDate >= from
    }

    if (!fromDate && toDate) {
      const to = new Date(toDate)
      to.setHours(23, 59, 59, 999)
      return purchaseDate <= to
    }

    return true
  })

  // Prepare data for CSV export
  const csvData = includeItems
    ? // Detailed export with items
      filteredPurchases.flatMap((purchase) => {
        // If no items or empty items array, return a single row for the purchase
        if (!purchase.items || purchase.items.length === 0) {
          return [
            {
              "PO Number": purchase.poNumber,
              Supplier: purchase.supplierName,
              "Order Date": new Date(purchase.orderDate).toLocaleDateString(),
              "Created At": new Date(purchase.createdAt).toLocaleString(),
              Status: purchase.status,
              "Payment Status": purchase.paymentStatus,
              "Total Amount": `₹${purchase.totalAmount.toFixed(2)}`,
              "Paid Amount": `₹${purchase.paidAmount.toFixed(2)}`,
              Balance: `₹${(purchase.totalAmount - purchase.paidAmount).toFixed(2)}`,
              Notes: purchase.notes || "",
              "Product Name": "",
              SKU: "",
              Quantity: "",
              "Received Quantity": "",
              "Unit Price": "",
              "Tax Rate": "",
              "Total Price": "",
            },
          ]
        }

        // Return a row for each item in the purchase
        return purchase.items.map((item, index) => ({
          "PO Number": index === 0 ? purchase.poNumber : "",
          Supplier: index === 0 ? purchase.supplierName : "",
          "Order Date": index === 0 ? new Date(purchase.orderDate).toLocaleDateString() : "",
          "Created At": index === 0 ? new Date(purchase.createdAt).toLocaleString() : "",
          Status: index === 0 ? purchase.status : "",
          "Payment Status": index === 0 ? purchase.paymentStatus : "",
          "Total Amount": index === 0 ? `₹${purchase.totalAmount.toFixed(2)}` : "",
          "Paid Amount": index === 0 ? `₹${purchase.paidAmount.toFixed(2)}` : "",
          Balance: index === 0 ? `₹${(purchase.totalAmount - purchase.paidAmount).toFixed(2)}` : "",
          Notes: index === 0 ? purchase.notes || "" : "",
          "Product Name": item.productName,
          SKU: item.productSku,
          Quantity: item.quantity,
          "Received Quantity": item.receivedQuantity || 0,
          "Unit Price": `₹${item.unitPrice.toFixed(2)}`,
          "Tax Rate": `${item.taxRate}%`,
          "Total Price": `₹${item.totalPrice.toFixed(2)}`,
        }))
      })
    : // Summary export without items
      filteredPurchases.map((purchase) => {
        // Calculate total received quantity and total items
        const totalReceivedQty = purchase.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0)
        const totalItems = purchase.items.reduce((sum, item) => sum + item.quantity, 0)

        return {
          "PO Number": purchase.poNumber,
          Supplier: purchase.supplierName,
          "Order Date": new Date(purchase.orderDate).toLocaleDateString(),
          "Created At": new Date(purchase.createdAt).toLocaleString(),
          "Expected Delivery": purchase.expectedDeliveryDate
            ? new Date(purchase.expectedDeliveryDate).toLocaleDateString()
            : "N/A",
          "Delivery Date": purchase.deliveryDate ? new Date(purchase.deliveryDate).toLocaleDateString() : "N/A",
          Status: purchase.status,
          "Payment Status": purchase.paymentStatus,
          "Total Amount": `₹${purchase.totalAmount.toFixed(2)}`,
          "Paid Amount": `₹${purchase.paidAmount.toFixed(2)}`,
          Balance: `₹${(purchase.totalAmount - purchase.paidAmount).toFixed(2)}`,
          "Total Items": totalItems,
          "Received Items": totalReceivedQty,
          "Created By": purchase.createdBy,
          Notes: purchase.notes || "",
        }
      })

  // Generate filename with date range
  const getFileName = () => {
    const fromStr = fromDate ? fromDate.toISOString().split("T")[0] : "start"
    const toStr = toDate ? toDate.toISOString().split("T")[0] : "end"
    const detailStr = includeItems ? "detailed" : "summary"
    return `purchases_${fromStr}_to_${toStr}_${detailStr}.csv`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Purchases</DialogTitle>
          <DialogDescription>Select a date range and export options for purchase orders.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                From Date
              </Label>
              <DatePicker date={fromDate} setDate={setFromDate} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                To Date
              </Label>
              <DatePicker date={toDate} setDate={setToDate} />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="includeItems"
              checked={includeItems}
              onCheckedChange={(checked) => setIncludeItems(checked as boolean)}
            />
            <Label
              htmlFor="includeItems"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include detailed item information
            </Label>
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              {filteredPurchases.length} purchase orders will be exported.
              {includeItems && filteredPurchases.length > 0 && (
                <span>
                  {" "}
                  Including approximately {filteredPurchases.reduce((sum, p) => sum + (p.items?.length || 0), 0)} line
                  items.
                </span>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <CSVLink
            data={csvData}
            filename={getFileName()}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            target="_blank"
            onClick={() => {
              // Close dialog after small delay to allow download to start
              setTimeout(() => onOpenChange(false), 100)
            }}
          >
            Download CSV
          </CSVLink>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
