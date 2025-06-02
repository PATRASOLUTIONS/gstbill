"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Download } from "lucide-react"

interface ExportSalesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportSalesDialog({ open, onOpenChange }: ExportSalesDialogProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState("csv")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Prepare query parameters
      const params = new URLSearchParams()
      params.append("format", exportFormat)

      if (dateRange.from) {
        params.append("startDate", dateRange.from.toISOString())
      }

      if (dateRange.to) {
        params.append("endDate", dateRange.to.toISOString())
      }

      // Make the export request
      const response = await fetch(`/api/sales/export?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to export sales data")
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url

      // Set the filename based on the content type
      const filename = `sales_export_${new Date().toISOString().split("T")[0]}.${exportFormat}`
      a.download = filename

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Close the dialog
      onOpenChange(false)

      toast({
        title: "Export Successful",
        description: `Sales data has been exported as ${exportFormat.toUpperCase()}`,
      })
    } catch (error) {
      console.error("Error exporting sales:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export sales data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Sales Data</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="exportFormat">Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger id="exportFormat">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="startDate" className="w-20">
                  From:
                </Label>
                <DatePicker
                  id="startDate"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="endDate" className="w-20">
                  To:
                </Label>
                <DatePicker
                  id="endDate"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

