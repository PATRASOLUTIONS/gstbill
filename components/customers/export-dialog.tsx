"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Download } from "lucide-react"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [format, setFormat] = useState("csv")
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Show toast notification
      toast({
        title: "Exporting customers",
        description: "Please wait while we prepare your export...",
      })

      // Make API request to export customers
      const response = await fetch(`/api/customers/export?format=${format}`)

      if (!response.ok) {
        throw new Error("Failed to export customers")
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob)

      // Create a temporary anchor element
      const a = document.createElement("a")
      a.href = url
      a.download = `customers-export-${new Date().toISOString().split("T")[0]}.${format}`
      document.body.appendChild(a)

      // Click the anchor to trigger the download
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Close the dialog
      onOpenChange(false)

      // Show success toast
      toast({
        title: "Export successful",
        description: `Customers exported successfully as ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error("Error exporting customers:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting customers. Please try again.",
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
          <DialogTitle>Export Customers</DialogTitle>
          <DialogDescription>Choose a format to export your customer data.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={format} onValueChange={setFormat} className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv" className="font-normal">
                CSV (Comma Separated Values)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="xlsx" id="xlsx" />
              <Label htmlFor="xlsx" className="font-normal">
                XLSX (Excel)
              </Label>
            </div>
          </RadioGroup>
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

