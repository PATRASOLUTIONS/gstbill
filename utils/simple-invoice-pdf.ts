import jsPDF from "jspdf"
import "jspdf-autotable"
import { formatCurrency } from "@/utils/format-currency"

/**
 * A simplified version of the invoice PDF generator
 * This is used as a fallback if the main generator fails
 */
export async function generateSimpleInvoicePdf(invoiceData: any): Promise<jsPDF> {
  try {
    console.log("Simple PDF generator started as fallback")

    // Create a new PDF document
    const doc = new jsPDF()

    // Set basic document properties
    doc.setProperties({
      title: `Invoice ${invoiceData.invoiceNumber || ""}`,
      subject: "Invoice",
      author: "Inventory Management System",
      creator: "Inventory Management System",
    })

    // Basic header
    doc.setFontSize(22)
    doc.text("INVOICE", 105, 20, { align: "center" })

    // Invoice number and date
    doc.setFontSize(12)
    doc.text(`Invoice Number: ${invoiceData.invoiceNumber || invoiceData.number || "N/A"}`, 20, 40)
    doc.text(`Date: ${new Date(invoiceData.date || Date.now()).toLocaleDateString()}`, 20, 50)

    // Customer info if available
    if (invoiceData.customer) {
      doc.text(`Customer: ${invoiceData.customer.name || invoiceData.customer.customerName || "N/A"}`, 20, 60)
    }

    // Simple table for items
    const tableColumn = ["Item", "Quantity", "Price", "Total"]

    // Ensure items is an array
    let items = []
    try {
      console.log("Simple PDF - items type:", typeof invoiceData.items)

      if (Array.isArray(invoiceData.items)) {
        items = invoiceData.items
        console.log("Simple PDF - items is already an array with length:", items.length)
      } else if (invoiceData.items && typeof invoiceData.items === "object") {
        // Try to convert from object to array
        try {
          items = Object.values(invoiceData.items)
          console.log("Simple PDF - converted object to array with length:", items.length)
        } catch (objError) {
          console.error("Simple PDF - failed to convert object to array:", objError)
          items = []
        }
      } else {
        console.log("Simple PDF - items is neither array nor object:", invoiceData.items)
        items = []
      }

      // Final check to ensure items is definitely an array
      if (!Array.isArray(items)) {
        console.error("Simple PDF - items is still not an array after conversion attempts")
        items = []
      }
    } catch (e) {
      console.error("Simple PDF - error processing items:", e)
      items = []
    }

    let tableRows = []
    try {
      if (Array.isArray(items) && items.length > 0) {
        tableRows = items.map((item: any) => {
          if (!item) return ["Unknown Item", "0", "₹0.00", "₹0.00"]
          return [
            item.productName || (item.product ? item.product.name : "Unknown Item"),
            String(item.quantity || 0),
            formatCurrency(item.price || 0),
            formatCurrency(item.total || 0),
          ]
        })
      } else {
        // Add a default row if no items
        tableRows = [["No items available", "", "", ""]]
      }
    } catch (rowError) {
      console.error("Simple PDF - error creating table rows:", rowError)
      tableRows = [["Error processing items", "", "", ""]]
    }
    // Add the table
    ;(doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 66, 66] },
    })

    // Add totals at the bottom
    const finalY = (doc as any).lastAutoTable.finalY + 10

    doc.text(`Subtotal: ${formatCurrency(invoiceData.subtotal || 0)}`, 150, finalY, { align: "right" })
    doc.text(`Tax: ${formatCurrency(invoiceData.taxTotal || invoiceData.tax || 0)}`, 150, finalY + 10, {
      align: "right",
    })
    doc.text(`Total: ${formatCurrency(invoiceData.total || invoiceData.totalAmount || 0)}`, 150, finalY + 20, {
      align: "right",
    })

    // Footer
    doc.setFontSize(10)
    doc.text("Thank you for your business", 105, 280, { align: "center" })

    console.log("Simple PDF generation completed successfully")
    return doc
  } catch (error) {
    console.error("Error in simple PDF generation:", error)

    // If even the simple generator fails, create a truly minimal PDF
    const doc = new jsPDF()
    doc.text("Invoice could not be generated properly.", 20, 20)
    doc.text("Please contact support for assistance.", 20, 30)
    doc.text(`Invoice Number: ${invoiceData?.invoiceNumber || invoiceData?.number || "Unknown"}`, 20, 40)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 50)

    return doc
  }
}
