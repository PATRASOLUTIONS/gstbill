import jsPDF from "jspdf"
import "jspdf-autotable"
import { formatCurrency, formatDate } from "@/lib/utils"

export interface InvoiceItem {
  productId: string
  productName: string
  quantity: number
  price: number
  tax: number
  total: number
}

export interface CompanyData {
  companyName: string
  address: string[]
  gstin?: string
  state?: string
  stateCode?: string
  contact?: string
  email?: string
  logo?: string
  currency?: string
  taxRate?: string
}

export interface BankData {
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  branch?: string
}

export interface CustomerData {
  name: string
  email?: string
  contact?: string
  address?: string[]
  gstin?: string
  state?: string
  stateCode?: string
}

export interface InvoiceData {
  invoiceNumber: string
  date: string
  dueDate?: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  notes?: string
  paymentTerms?: string
  paymentStatus?: string
  paymentMethod?: string
  referenceNo?: string
}

/**
 * Generates a professional PDF invoice from the provided data
 * @param data The invoice data including company, customer, and invoice details
 * @returns Promise that resolves with the PDF document
 */
export async function generateInvoicePdf(invoiceData: any): Promise<jsPDF> {
  try {
    console.log("PDF generation started for invoice:", invoiceData.invoiceNumber || "unknown")

    // Create a new PDF document
    const doc = new jsPDF()

    // Set document properties
    doc.setProperties({
      title: `Invoice ${invoiceData.invoiceNumber || ""}`,
      subject: "Invoice",
      author: "Inventory Management System",
      creator: "Inventory Management System",
    })

    // Helper function to safely get text values
    const safeText = (value: any): string => {
      if (value === null || value === undefined) return "N/A"
      return String(value)
    }

    // Helper function to ensure we have an array
    const ensureArray = (value: any): any[] => {
      if (Array.isArray(value)) return value
      if (value === null || value === undefined) return []
      // If it's an object with numeric keys, try to convert it to an array
      if (typeof value === "object") {
        try {
          const asArray = Object.values(value)
          if (asArray.length > 0) return asArray
        } catch (e) {
          console.error("Failed to convert object to array:", e)
        }
      }
      return []
    }

    // Set fonts
    doc.setFont("helvetica", "bold")

    // HEADER SECTION
    // Company details (top left)
    doc.setFontSize(20)
    doc.text("INVOICE", 14, 20)

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")

    // Company details - safely handle potentially undefined values
    const company = invoiceData.company || {}
    doc.text(safeText(company.companyName || company.name), 14, 30)

    doc.setFont("helvetica", "normal")
    const companyAddress = company.address || ""
    doc.text(typeof companyAddress === "string" ? companyAddress : "Address not available", 14, 35)

    const cityStateZip = `${safeText(company.city || "")}, ${safeText(company.state || "")} ${safeText(company.pincode || "")}`
    doc.text(cityStateZip, 14, 40)

    doc.text(`GSTIN: ${safeText(company.gstin)}`, 14, 45)
    doc.text(`Phone: ${safeText(company.phone || company.contact)}`, 14, 50)
    doc.text(`Email: ${safeText(company.email)}`, 14, 55)

    // Invoice details (top right)
    const rightColumnX = 140
    doc.setFont("helvetica", "bold")
    doc.text("Invoice Number:", rightColumnX, 30)
    doc.text("Date:", rightColumnX, 35)
    doc.text("Due Date:", rightColumnX, 40)
    doc.text("Status:", rightColumnX, 45)

    doc.setFont("helvetica", "normal")
    doc.text(safeText(invoiceData.invoiceNumber || invoiceData.number), rightColumnX + 30, 30)

    // Format dates safely
    let invoiceDate = "N/A"
    try {
      invoiceDate = formatDate(invoiceData.date)
    } catch (e) {
      console.error("Error formatting invoice date:", e)
    }
    doc.text(invoiceDate, rightColumnX + 30, 35)

    let dueDate = "N/A"
    try {
      dueDate = formatDate(invoiceData.dueDate)
    } catch (e) {
      console.error("Error formatting due date:", e)
    }
    doc.text(dueDate, rightColumnX + 30, 40)

    // Set status with styling
    doc.setFont("helvetica", "bold")
    const status = (invoiceData.status || "pending").toUpperCase()
    doc.setTextColor(0, 0, 0) // Black for all statuses in B&W theme
    doc.text(status, rightColumnX + 30, 45)
    doc.setTextColor(0, 0, 0) // Reset text color to black

    // Add a separator line
    doc.setDrawColor(0, 0, 0) // Black line
    doc.setLineWidth(0.5)
    doc.line(14, 65, 196, 65)

    // BILL TO SECTION
    doc.setFont("helvetica", "bold")
    doc.text("BILL TO:", 14, 75)
    doc.setFont("helvetica", "normal")

    const customer = invoiceData.customer || {}
    doc.text(safeText(customer.name || customer.customerName), 14, 80)

    // Handle customer address safely
    let currentY = 85
    if (customer.address) {
      const address = typeof customer.address === "string" ? customer.address : "Address not available"
      doc.text(address, 14, currentY)
      currentY += 5

      const custCityStateZip = `${safeText(customer.city || "")}, ${safeText(customer.state || "")} ${safeText(customer.pincode || "")}`
      doc.text(custCityStateZip, 14, currentY)
      currentY += 5

      doc.text(`GSTIN: ${safeText(customer.gstin)}`, 14, currentY)
      currentY += 5

      doc.text(`Phone: ${safeText(customer.phone)}`, 14, currentY)
      currentY += 5

      doc.text(`Email: ${safeText(customer.email)}`, 14, currentY)
    }

    // INVOICE ITEMS TABLE
    const tableStartY = 115

    // Prepare the data for the table - safely handle items
    // Use our ensureArray helper to make sure we have an array to map over
    const items = ensureArray(invoiceData.items)

    console.log("Items type:", typeof invoiceData.items)
    console.log("Items after ensureArray:", items)

    let tableData = []
    try {
      // Make absolutely sure items is an array before mapping
      if (Array.isArray(items)) {
        tableData = items.map((item: any) => {
          if (!item)
            return { item: "Unknown", description: "", quantity: "0", unitPrice: "₹0.00", tax: "0%", amount: "₹0.00" }
          const product = item.product || {}
          return {
            item: safeText(item.productName || product.name),
            description: safeText(product.description || ""),
            quantity: safeText(item.quantity),
            unitPrice: formatCurrency(item.price || item.unitPrice || 0),
            tax: `${safeText(item.tax || item.taxRate || 0)}%`,
            amount: formatCurrency(item.total || item.totalAmount || 0),
          }
        })
      } else {
        console.error("Items is not an array after ensureArray:", items)
        // Provide a default empty row
        tableData = [
          {
            item: "No items available",
            description: "",
            quantity: "",
            unitPrice: "",
            tax: "",
            amount: "",
          },
        ]
      }
    } catch (mapError) {
      console.error("Error mapping invoice items:", mapError)
      // Fallback to empty table
      tableData = [
        {
          item: "Error processing items",
          description: "",
          quantity: "",
          unitPrice: "",
          tax: "",
          amount: "",
        },
      ]
    }
    ;(doc as any).autoTable({
      head: [["Item", "Description", "Quantity", "Unit Price", "Tax", "Amount"]],
      body: Array.isArray(tableData)
        ? tableData.map((row: any) => [
            row?.item || "",
            row?.description || "",
            row?.quantity || "",
            row?.unitPrice || "",
            row?.tax || "",
            row?.amount || "",
          ])
        : [["No data available", "", "", "", "", ""]],
      startY: tableStartY,
      theme: "plain",
      styles: {
        fontSize: 9,
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 50 },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 25, halign: "right" },
        4: { cellWidth: 20, halign: "center" },
        5: { cellWidth: 30, halign: "right" },
      },
      margin: { left: 14, right: 14 },
    })

    // Get the Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 10

    // TOTALS SECTION (right-aligned)
    const totalsX = 140
    currentY = finalY

    doc.setFont("helvetica", "normal")
    doc.text("Subtotal:", totalsX, currentY)

    // Right-align text without using options object (which can cause issues)
    const subtotalText = formatCurrency(invoiceData.subtotal || 0)
    const subtotalWidth = (doc.getStringUnitWidth(subtotalText) * doc.getFontSize()) / doc.internal.scaleFactor
    doc.text(subtotalText, totalsX + 40 - subtotalWidth, currentY)

    currentY += 5

    // Add tax details if applicable
    const taxAmount = invoiceData.taxTotal || invoiceData.tax || 0
    if (taxAmount > 0) {
      doc.text("Tax:", totalsX, currentY)

      const taxText = formatCurrency(taxAmount)
      const taxWidth = (doc.getStringUnitWidth(taxText) * doc.getFontSize()) / doc.internal.scaleFactor
      doc.text(taxText, totalsX + 40 - taxWidth, currentY)

      currentY += 5
    }

    // Add discount if applicable
    const discountValue = invoiceData.discountValue || 0
    if (discountValue > 0) {
      doc.text("Discount:", totalsX, currentY)

      const discountText = `-${formatCurrency(discountValue)}`
      const discountWidth = (doc.getStringUnitWidth(discountText) * doc.getFontSize()) / doc.internal.scaleFactor
      doc.text(discountText, totalsX + 40 - discountWidth, currentY)

      currentY += 5
    }

    // Add a line before the total
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(totalsX, currentY, totalsX + 40, currentY)
    currentY += 5

    // Total amount
    doc.setFont("helvetica", "bold")
    doc.text("Total:", totalsX, currentY)

    const totalText = formatCurrency(invoiceData.total || invoiceData.totalAmount || 0)
    const totalWidth = (doc.getStringUnitWidth(totalText) * doc.getFontSize()) / doc.internal.scaleFactor
    doc.text(totalText, totalsX + 40 - totalWidth, currentY)

    currentY += 15

    // PAYMENT INFORMATION
    const bankDetails = invoiceData.bankDetails || {}
    if (Object.keys(bankDetails).length > 0) {
      doc.setFont("helvetica", "bold")
      doc.text("PAYMENT INFORMATION", 14, currentY)
      currentY += 5

      doc.setFont("helvetica", "normal")
      doc.text(`Bank Name: ${safeText(bankDetails.bankName)}`, 14, currentY)
      currentY += 5

      doc.text(`Account Number: ${safeText(bankDetails.accountNumber)}`, 14, currentY)
      currentY += 5

      doc.text(`IFSC Code: ${safeText(bankDetails.ifscCode)}`, 14, currentY)
      currentY += 5

      const accountHolder = bankDetails.accountHolderName || company.companyName || company.name || "Account Holder"
      doc.text(`Account Holder: ${safeText(accountHolder)}`, 14, currentY)
      currentY += 15
    }

    // TERMS AND NOTES
    if (invoiceData.notes) {
      doc.setFont("helvetica", "bold")
      doc.text("NOTES", 14, currentY)
      currentY += 5

      doc.setFont("helvetica", "normal")
      // Split notes into multiple lines if needed
      const notesText = safeText(invoiceData.notes)
      const splitNotes = doc.splitTextToSize(notesText, 180)
      doc.text(splitNotes, 14, currentY)
      currentY += splitNotes.length * 5 + 10
    }

    // FOOTER
    const footerY = 280
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(14, footerY - 5, 196, footerY - 5)

    doc.setFont("helvetica", "italic")
    doc.setFontSize(8)
    doc.text("Thank you for your business", 105, footerY, { align: "center" })
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, footerY + 5, { align: "center" })

    console.log("PDF generation completed successfully")
    return doc
  } catch (error) {
    console.error("Error in PDF generation function:", error)
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Export with the correct capitalization that's expected by the system
export const generateInvoicePDF = generateInvoicePdf
