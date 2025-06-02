"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface ExportInvoicesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportInvoicesDialog({ open, onOpenChange }: ExportInvoicesDialogProps) {
  const [fileFormat, setFileFormat] = useState("csv")
  const [dateRange, setDateRange] = useState("all")
  const [includeDetails, setIncludeDetails] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Export successful",
        description: `Invoices have been exported as ${fileFormat.toUpperCase()}.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error exporting invoices:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your invoices. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Invoices</DialogTitle>
          <DialogDescription>Choose your export options below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <Label>File Format</Label>
            <RadioGroup
              defaultValue="csv"
              value={fileFormat}
              onValueChange={setFileFormat}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel">Excel</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label>Date Range</Label>
            <RadioGroup
              defaultValue="all"
              value={dateRange}
              onValueChange={setDateRange}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All Time</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thisMonth" id="thisMonth" />
                <Label htmlFor="thisMonth">This Month</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lastMonth" id="lastMonth" />
                <Label htmlFor="lastMonth">Last Month</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thisYear" id="thisYear" />
                <Label htmlFor="thisYear">This Year</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeDetails"
              checked={includeDetails}
              onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
            />
            <Label htmlFor="includeDetails">Include line item details</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

