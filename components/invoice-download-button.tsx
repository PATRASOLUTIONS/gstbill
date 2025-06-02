"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Download } from "lucide-react"

interface PDFDownloadButtonProps {
  invoiceId: string
}

export default function PDFDownloadButton({ invoiceId }: PDFDownloadButtonProps) {
  const [isClient, setIsClient] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const generatePDF = async () => {
    if (!isClient) return

    try {
      setIsGenerating(true)

      toast({
        title: "Generating PDF...",
        description: "Please wait while we generate the invoice PDF.",
      })

      // Fetch invoice data from the API
      const response = await fetch(`/api/invoice/${invoiceId}/download`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to fetch invoice data")
      }

      const data = await response.json()

      // Create new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Set document properties
      doc.setProperties({
        title: `Invoice ${data.invoice.number || ""}`,
        subject: "Invoice",
        author: "Inventory Management System",
        creator: "Inventory Management System",
      })

      // Add content to the PDF
      doc.text(`Invoice Number: ${data.invoice.number || ""}`, 20, 20)
      doc.text(`Customer: ${data.customer.name}`, 20, 30)
      doc.text(`Total: ${data.invoice.total}`, 20, 40)

      // Save the PDF
      doc.save(`Invoice-${data.invoice.number}.pdf`)

      toast({
        title: "Success",
        description: "Invoice downloaded successfully!",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={generatePDF} disabled={isGenerating}>
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  )
}

