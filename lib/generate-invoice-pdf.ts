import jsPDF from "jspdf"
import "jspdf-autotable"
import { formatCurrency, formatDate } from "@/lib/utils"

// Add the autotable plugin to jsPDF
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface InvoiceItem {
  id: string
  name: string
  quantity: number
  price: number
  total: number
  hsn?: string
  gstRate?: number
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
  branch?: string
  ifscCode?: string
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

export async function generateInvoicePDF(
  invoice: InvoiceData,
  company: CompanyData,
  customer: CustomerData,
  bank: BankData,
): Promise<jsPDF> {
  // Create a new PDF document
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  let yPos = margin

  // Set default font
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  // Add company logo if available
  if (company.logo) {
    try {
      // Add logo at the top left
      const logoWidth = 40
      const logoHeight = 20
      doc.addImage(company.logo, "PNG", margin, yPos, logoWidth, logoHeight)
      yPos += logoHeight + 5
    } catch (error) {
      console.error("Error adding logo:", error)
      // If logo fails, add some space and continue
      yPos += 5
    }
  } else {
    yPos += 5
  }

  // Add company information
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(company.companyName, margin, yPos)
  yPos += 8

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")

  // Company address
  if (company.address && company.address.length > 0) {
    company.address.forEach((line) => {
      doc.text(line, margin, yPos)
      yPos += 4
    })
  }

  // Company contact info
  if (company.contact) {
    doc.text(`Phone: ${company.contact}`, margin, yPos)
    yPos += 4
  }

  if (company.email) {
    doc.text(`Email: ${company.email}`, margin, yPos)
    yPos += 4
  }

  if (company.gstin) {
    doc.text(`GSTIN: ${company.gstin}`, margin, yPos)
    yPos += 4
  }

  // Add invoice title and details on the right side
  const rightColumnX = pageWidth - margin - 60
  let rightColumnY = margin

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("INVOICE", rightColumnX, rightColumnY)
  rightColumnY += 10

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Invoice Number:", rightColumnX, rightColumnY)
  doc.setFont("helvetica", "normal")
  doc.text(invoice.invoiceNumber, rightColumnX + 35, rightColumnY)
  rightColumnY += 6

  doc.setFont("helvetica", "bold")
  doc.text("Date:", rightColumnX, rightColumnY)
  doc.setFont("helvetica", "normal")
  doc.text(formatDate(new Date(invoice.date)), rightColumnX + 35, rightColumnY)
  rightColumnY += 6

  if (invoice.dueDate) {
    doc.setFont("helvetica", "bold")
    doc.text("Due Date:", rightColumnX, rightColumnY)
    doc.setFont("helvetica", "normal")
    doc.text(formatDate(new Date(invoice.dueDate)), rightColumnX + 35, rightColumnY)
    rightColumnY += 6
  }

  if (invoice.paymentStatus) {
    doc.setFont("helvetica", "bold")
    doc.text("Status:", rightColumnX, rightColumnY)
    doc.setFont("helvetica", "normal")

    // Set color based on payment status
    if (invoice.paymentStatus.toLowerCase() === "paid") {
      doc.setTextColor(0, 128, 0) // Green for paid
    } else if (invoice.paymentStatus.toLowerCase() === "unpaid") {
      doc.setTextColor(255, 0, 0) // Red for unpaid
    } else if (invoice.paymentStatus.toLowerCase() === "partial") {
      doc.setTextColor(255, 165, 0) // Orange for partial
    }

    doc.text(invoice.paymentStatus, rightColumnX + 35, rightColumnY)
    doc.setTextColor(0, 0, 0) // Reset to black
    rightColumnY += 6
  }

  // Add a separator line
  yPos = Math.max(yPos, rightColumnY) + 5
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // Add customer information
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Bill To:", margin, yPos)
  yPos += 6

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(customer.name, margin, yPos)
  yPos += 5

  if (customer.address && customer.address.length > 0) {
    customer.address.forEach((line) => {
      doc.text(line, margin, yPos)
      yPos += 5
    })
  }

  if (customer.contact) {
    doc.text(`Phone: ${customer.contact}`, margin, yPos)
    yPos += 5
  }

  if (customer.email) {
    doc.text(`Email: ${customer.email}`, margin, yPos)
    yPos += 5
  }

  if (customer.gstin) {
    doc.text(`GSTIN: ${customer.gstin}`, margin, yPos)
    yPos += 5
  }

  yPos += 10

  // Add invoice items table
  const tableColumns = [
    { header: "Item", dataKey: "name" },
    { header: "HSN/SAC", dataKey: "hsn" },
    { header: "Qty", dataKey: "quantity" },
    { header: "Rate", dataKey: "price" },
    { header: "GST", dataKey: "gst" },
    { header: "Amount", dataKey: "total" },
  ]

  const tableRows = invoice.items.map((item) => ({
    name: item.name,
    hsn: item.hsn || "",
    quantity: item.quantity.toString(),
    price: formatCurrency(item.price),
    gst: item.gstRate ? `${item.gstRate}%` : "",
    total: formatCurrency(item.total),
  }))

  doc.autoTable({
    startY: yPos,
    head: [tableColumns.map((col) => col.header)],
    body: tableRows.map((row) => tableColumns.map((col) => row[col.dataKey as keyof typeof row])),
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 5,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "left",
    },
    theme: "grid",
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 30, halign: "right" },
    },
  })

  // Get the Y position after the table
  yPos = (doc as any).lastAutoTable.finalY + 10

  // Add summary section (right aligned)
  const summaryX = pageWidth - margin - 80
  const summaryValueX = pageWidth - margin

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Subtotal:", summaryX, yPos)
  doc.text(formatCurrency(invoice.subtotal), summaryValueX, yPos, { align: "right" })
  yPos += 6

  doc.text("Tax:", summaryX, yPos)
  doc.text(formatCurrency(invoice.tax), summaryValueX, yPos, { align: "right" })
  yPos += 6

  doc.setFont("helvetica", "bold")
  doc.text("Total:", summaryX, yPos)
  doc.text(formatCurrency(invoice.total), summaryValueX, yPos, { align: "right" })
  yPos += 10

  // Add a separator line
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // Add bank details
  if (bank) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Payment Details", margin, yPos)
    yPos += 6

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`Account Name: ${bank.accountHolderName}`, margin, yPos)
    yPos += 5
    doc.text(`Bank Name: ${bank.bankName}`, margin, yPos)
    yPos += 5
    doc.text(`Account Number: ${bank.accountNumber}`, margin, yPos)
    yPos += 5

    if (bank.branch) {
      doc.text(`Branch: ${bank.branch}`, margin, yPos)
      yPos += 5
    }

    if (bank.ifscCode) {
      doc.text(`IFSC Code: ${bank.ifscCode}`, margin, yPos)
      yPos += 5
    }
  }

  // Add payment terms and notes
  if (invoice.paymentTerms || invoice.notes) {
    yPos += 5
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Terms & Notes", margin, yPos)
    yPos += 6

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")

    if (invoice.paymentTerms) {
      doc.text(`Payment Terms: ${invoice.paymentTerms}`, margin, yPos)
      yPos += 5
    }

    if (invoice.notes) {
      doc.text("Notes:", margin, yPos)
      yPos += 5

      // Split notes into multiple lines if needed
      const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin)
      doc.text(splitNotes, margin, yPos)
      yPos += splitNotes.length * 5
    }
  }

  // Add footer
  const footerY = pageHeight - 10
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Thank you for your business!", pageWidth / 2, footerY, { align: "center" })

  // Add page number
  doc.text(`Page 1 of 1`, pageWidth - margin, footerY, { align: "right" })

  return doc
}

// Helper function to create a PDF from invoice data
export async function createInvoicePDF(invoiceData: any): Promise<jsPDF> {
  // Extract data from the API response
  const { invoice, customer, company, bank } = invoiceData

  // Format the data for the PDF generator
  const formattedInvoice: InvoiceData = {
    invoiceNumber: invoice.invoiceNumber || invoice.number || "",
    date: invoice.date || new Date().toISOString(),
    dueDate: invoice.dueDate || undefined,
    items: invoice.items.map((item: any) => ({
      id: item.id || item._id || "",
      name: item.name || item.description || "",
      quantity: item.quantity || 0,
      price: item.price || item.rate || 0,
      total: item.total || item.quantity * item.price || 0,
      hsn: item.hsn || "",
      gstRate: item.gstRate || 0,
    })),
    subtotal: invoice.subtotal || invoice.subTotal || 0,
    tax: invoice.tax || invoice.taxAmount || 0,
    total: invoice.total || invoice.totalAmount || 0,
    notes: invoice.notes || "",
    paymentTerms: invoice.paymentTerms || "",
    paymentStatus: invoice.paymentStatus || "Unpaid",
    paymentMethod: invoice.paymentMethod || "",
    referenceNo: invoice.referenceNo || "",
  }

  const formattedCompany: CompanyData = {
    companyName: company?.companyName || "",
    address: company?.address || [],
    gstin: company?.gstin || "",
    state: company?.state || "",
    stateCode: company?.stateCode || "",
    contact: company?.contact || "",
    email: company?.email || "",
    logo: company?.logo || "",
    currency: company?.currency || "INR",
    taxRate: company?.taxRate || "18",
  }

  const formattedCustomer: CustomerData = {
    name: customer?.name || "Walk-in Customer",
    email: customer?.email || "",
    contact: customer?.contact || customer?.contactNumber || "",
    address: customer?.address || [],
    gstin: customer?.gstin || "",
    state: customer?.state || "",
    stateCode: customer?.stateCode || "",
  }

  const formattedBank: BankData = {
    accountHolderName: bank?.accountHolderName || "",
    bankName: bank?.bankName || "",
    accountNumber: bank?.accountNumber || "",
    branch: bank?.branch || "",
    ifscCode: bank?.ifscCode || "",
  }

  // Generate the PDF
  return generateInvoicePDF(formattedInvoice, formattedCompany, formattedCustomer, formattedBank)
}
