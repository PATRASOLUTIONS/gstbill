"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, FileDown } from "lucide-react"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const { toast } = useToast()
  const [exportFormat, setExportFormat] = useState<string>("csv")
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      toast({
        title: "Preparing export...",
        description: "Retrieving all invoice data. This may take a moment.",
      })

      // Build query parameters
      const params = new URLSearchParams()
      params.append("format", exportFormat)
      params.append("exportAll", "true") // Signal to export all data

      console.log("Starting export with format:", exportFormat)

      // Get the current user's ID
      const userResponse = await fetch("/api/user")
      const userData = await userResponse.json()
      const userId = userData.id

      // Fetch invoices filtered by the current user
      const response = await fetch(`/api/invoices/export?userId=${userId}`)

      if (!response.ok) {
        console.error("Export failed with status:", response.status)
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || "Failed to export invoices")
        } catch (e) {
          throw new Error(`Failed to export invoices: ${errorText || response.statusText}`)
        }
      }

      // Get the blob from the response
      const blob = await response.blob()
      console.log("Received blob:", blob.type, "size:", blob.size)

      if (blob.size === 0) {
        throw new Error("Received empty file")
      }

      // Check if the blob contains an error message
      if (blob.type.includes("application/json")) {
        const text = await blob.text()
        try {
          const errorData = JSON.parse(text)
          if (errorData.error) {
            throw new Error(errorData.error)
          }
        } catch (e) {
          // If it's not valid JSON, continue with download
          console.log("Not a JSON error response, continuing with download")
        }
      }

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob)

      // Create a temporary link element
      const a = document.createElement("a")
      a.href = url
      a.download = `invoice-data-export-${new Date().toISOString().split("T")[0]}.${getFileExtension(exportFormat)}`

      // Append to the document, click it, and clean up
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export successful",
        description: "All invoice data has been exported successfully.",
      })

      // Close the dialog
      onOpenChange(false)
    } catch (error) {
      console.error("Error exporting invoices:", error)
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export invoices",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Helper function to get content type based on format
  const getContentType = (format: string): string => {
    switch (format) {
      case "csv":
        return "text/csv"
      case "xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      case "json":
        return "application/json"
      default:
        return "text/csv"
    }
  }

  // Helper function to get file extension based on format
  const getFileExtension = (format: string): string => {
    switch (format) {
      case "csv":
        return "csv"
      case "xlsx":
        return "xlsx"
      case "json":
        return "json"
      default:
        return "csv"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Invoice Data</DialogTitle>
          <DialogDescription>
            Export all invoice data from the database. This will include all invoices and their details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger id="format" className="col-span-3">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
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
                <FileDown className="mr-2 h-4 w-4" />
                Export All Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
