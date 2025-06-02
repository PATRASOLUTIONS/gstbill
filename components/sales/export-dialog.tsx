"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { CSVLink } from "react-csv"
import { FileDown } from "lucide-react"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const { toast } = useToast()
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [status, setStatus] = useState<string>("all")
  const [paymentStatus, setPaymentStatus] = useState<string>("all")
  const [exportData, setExportData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [dataReady, setDataReady] = useState<boolean>(false)

  const fetchExportData = async () => {
    try {
      setIsLoading(true)
      setDataReady(false)

      // Build query parameters
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (status !== "all") params.append("status", status)
      if (paymentStatus !== "all") params.append("paymentStatus", paymentStatus)

      const response = await fetch(`/api/sales/export?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch export data")
      }

      const data = await response.json()
      setExportData(data.sales || [])
      setDataReady(true)

      toast({
        title: "Data Ready",
        description: `${data.sales.length} records ready for export.`,
      })
    } catch (error) {
      console.error("Error fetching export data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch export data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const headers = [
    { label: "Sale ID", key: "_id" },
    { label: "Date", key: "saleDate" },
    { label: "Customer", key: "customerName" },
    { label: "Status", key: "status" },
    { label: "Payment Status", key: "paymentStatus" },
    { label: "Subtotal", key: "subtotal" },
    { label: "Tax", key: "taxTotal" },
    { label: "Total", key: "total" },
    { label: "Created At", key: "createdAt" },
  ]

  const csvFilename = `sales-export-${new Date().toISOString().split("T")[0]}.csv`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Sales Data</DialogTitle>
          <DialogDescription>Select a date range and filters to export sales data as CSV.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger id="paymentStatus">
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Statuses</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={fetchExportData} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Fetching...
              </>
            ) : (
              "Fetch Data"
            )}
          </Button>
          {dataReady && (
            <CSVLink
              data={exportData}
              headers={headers}
              filename={csvFilename}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Download CSV
            </CSVLink>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

