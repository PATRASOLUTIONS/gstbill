"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined)
  const [toDate, setToDate] = useState<Date | undefined>(undefined)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Build the URL with query parameters
      let url = `/api/suppliers?format=csv`

      if (fromDate) {
        url += `&fromDate=${format(fromDate, "yyyy-MM-dd")}`
      }

      if (toDate) {
        url += `&toDate=${format(toDate, "yyyy-MM-dd")}`
      }

      // Create a temporary link element
      const link = document.createElement("a")
      link.href = url

      // Create filename with date range
      let filename = "suppliers"
      if (fromDate && toDate) {
        filename += `-${format(fromDate, "yyyy-MM-dd")}-to-${format(toDate, "yyyy-MM-dd")}`
      } else if (fromDate) {
        filename += `-from-${format(fromDate, "yyyy-MM-dd")}`
      } else if (toDate) {
        filename += `-to-${format(toDate, "yyyy-MM-dd")}`
      }
      filename += `.csv`

      link.setAttribute("download", filename)
      document.body.appendChild(link)

      // Trigger the download
      link.click()

      // Clean up
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: "Suppliers exported successfully",
        variant: "default",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error exporting suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to export suppliers",
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
          <DialogTitle>Export Suppliers</DialogTitle>
          <DialogDescription>
            Select a date range to filter suppliers for export. Leave blank to export all suppliers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="fromDate" className="text-sm font-medium">
                From Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="fromDate"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !fromDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus />
                </PopoverContent>
              </Popover>
              {fromDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs text-muted-foreground"
                  onClick={() => setFromDate(undefined)}
                >
                  Clear date
                </Button>
              )}
            </div>
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="toDate" className="text-sm font-medium">
                To Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="toDate"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !toDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                    disabled={(date) => (fromDate ? date < fromDate : false)}
                  />
                </PopoverContent>
              </Popover>
              {toDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs text-muted-foreground"
                  onClick={() => setToDate(undefined)}
                >
                  Clear date
                </Button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Download CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

