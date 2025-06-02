"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface InvoiceGeneratorProps {
  saleId: string
  disabled?: boolean
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  onSuccess?: (invoiceId: string, invoiceNumber: string) => void
}

export function InvoiceGenerator({
  saleId,
  disabled = false,
  variant = "default",
  size = "default",
  className = "",
  onSuccess,
}: InvoiceGeneratorProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleCreateInvoice = async () => {
    try {
      setIsGenerating(true)

      toast({
        title: "Creating Invoice",
        description: "Please wait while we create the invoice...",
      })

      const response = await fetch(`/api/invoice/from-sale?saleId=${saleId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // Check if invoice already exists
        if (response.status === 400 && errorData.invoiceId) {
          toast({
            title: "Invoice Already Exists",
            description: `Invoice ${errorData.invoiceNumber} already exists for this sale.`,
          })

          // Call the success callback if provided
          if (onSuccess) {
            onSuccess(errorData.invoiceId, errorData.invoiceNumber)
          } else {
            // Redirect to invoices page after a short delay
            setTimeout(() => {
              router.push(`/invoices/${errorData.invoiceId}`)
            }, 1500)
          }

          return
        }

        throw new Error(errorData.error || "Failed to create invoice")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to create invoice")
      }

      toast({
        title: "Success",
        description: `Invoice ${data.invoiceNumber} created successfully`,
      })

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(data.invoiceId, data.invoiceNumber)
      } else {
        // Redirect to invoices page after a short delay
        setTimeout(() => {
          router.push(`/invoices/${data.invoiceId}`)
        }, 1500)
      }
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleCreateInvoice}
      disabled={disabled || isGenerating}
    >
      {isGenerating ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          Generating...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          Create Invoice
        </>
      )}
    </Button>
  )
}

