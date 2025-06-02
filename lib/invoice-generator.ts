import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Helper function to convert number to words (Indian numbering system)
function numberToWords(num: number): string {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  if (num === 0) return "Zero"

  function convertLessThanOneThousand(num: number): string {
    if (num < 20) {
      return units[num]
    }

    const ten = Math.floor(num / 10) % 10
    const unit = num % 10

    return (ten > 0 ? tens[ten] + " " : "") + (unit > 0 ? units[unit] : "")
  }

  function convert(num: number): string {
    if (num < 100) {
      return convertLessThanOneThousand(num)
    }

    if (num < 1000) {
      return (
        units[Math.floor(num / 100)] +
        " Hundred " +
        (num % 100 > 0 ? "and " + convertLessThanOneThousand(num % 100) : "")
      )
    }

    if (num < 100000) {
      return convert(Math.floor(num / 1000)) + " Thousand " + (num % 1000 > 0 ? convert(num % 1000) : "")
    }

    if (num < 10000000) {
      return convert(Math.floor(num / 100000)) + " Lakh " + (num % 100000 > 0 ? convert(num % 100000) : "")
    }

    return convert(Math.floor(num / 10000000)) + " Crore " + (num % 10000000 > 0 ? convert(num % 10000000) : "")
  }

  // Round to 2 decimal places and split
  const parts = num.toFixed(2).split(".")
  const wholePart = Number.parseInt(parts[0])
  const decimalPart = Number.parseInt(parts[1])

  let result = convert(wholePart)

  if (decimalPart > 0) {
    result += " and " + convert(decimalPart) + " Paise"
  }

  return result
}

export async function generateInvoicePDF(sale: any): Promise<Buffer> {
  try {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Set default font
    doc.setFont("helvetica")

    // Define margins and positions
    const margin = 10
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const contentWidth = pageWidth - margin * 2

    // Add professional border to the page
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - margin * 2 + 4)

    // Add "ORIGINAL FOR RECIPIENT" watermark
    doc.setTextColor(230, 230, 230)
    doc.setFontSize(40)
    doc.setFont("helvetica", "bold")
    doc.text("ORIGINAL", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 })

    // Reset text color for rest of document
    doc.setTextColor(0, 0, 0)

    // Add title with professional styling
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, margin, contentWidth, 10, "F")
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("TAX INVOICE", pageWidth / 2, margin + 6.5, { align: "center" })

    // Add invoice number in top right
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(`Invoice No: ${sale.invoiceNumber || "N/A"}`, pageWidth - margin - 2, margin + 6.5, { align: "right" })

    // Start position for content
    let yPos = margin + 15

    // Create a 2-column layout for seller and buyer
    const colWidth = contentWidth / 2 - 2

    // Seller details (left column)
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.1)
    doc.rect(margin, yPos, colWidth, 35)

    // Seller header
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPos, colWidth, 6, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("SELLER", margin + 2, yPos + 4)

    // Seller details
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Your Company Name", margin + 2, yPos + 10)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)

    // Format address with line breaks
    const sellerAddress = "123 Business Street\nCity, State, ZIP"
    const sellerAddressLines = sellerAddress.split("\n")
    let sellerY = yPos + 14
    sellerAddressLines.forEach((line) => {
      doc.text(line, margin + 2, sellerY)
      sellerY += 3.5
    })

    // Ensure consistent positioning of GSTIN and State
    const sellerInfoY = yPos + 28
    doc.text(`GSTIN: 29AAAAA0000A1Z5`, margin + 2, sellerInfoY)
    doc.text(`State: Karnataka (29)`, margin + 2, sellerInfoY + 4)

    // Buyer details (right column)
    doc.rect(margin + colWidth + 4, yPos, colWidth, 35)

    // Buyer header
    doc.setFillColor(240, 240, 240)
    doc.rect(margin + colWidth + 4, yPos, colWidth, 6, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("BUYER", margin + colWidth + 6, yPos + 4)

    // Buyer details
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text(sale.customer?.name || "Walk-in Customer", margin + colWidth + 6, yPos + 10)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)

    // Format buyer address with line breaks
    const buyerAddress = sale.customer?.address || "N/A"
    const buyerAddressLines = buyerAddress.split("\n")
    let buyerY = yPos + 14
    buyerAddressLines.forEach((line) => {
      doc.text(line, margin + colWidth + 6, buyerY)
      buyerY += 3.5
    })

    // Ensure consistent positioning of GSTIN and State
    const buyerInfoY = yPos + 28
    if (sale.customer?.gstin) {
      doc.text(`GSTIN: ${sale.customer.gstin}`, margin + colWidth + 6, buyerInfoY)
    }
    doc.text(
      `State: ${sale.customer?.state || "Same State"} (${sale.customer?.stateCode || "29"})`,
      margin + colWidth + 6,
      buyerInfoY + 4,
    )

    // Move position after boxes - directly to items table
    yPos += 40

    // Determine if IGST or CGST/SGST applies (default to same state)
    const isIGST = false // Default to CGST/SGST

    // Create items table with improved styling and alignment
    const itemsTableData = Array.isArray(sale.items)
      ? sale.items.map((item: any, index: number) => {
          const taxableAmount = (item.quantity || 0) * (item.price || 0)
          const taxRate = item.taxRate || 18 // Default tax rate
          const taxAmount = (taxableAmount * taxRate) / 100
          const cgstAmount = isIGST ? 0 : taxAmount / 2
          const sgstAmount = isIGST ? 0 : taxAmount / 2
          const igstAmount = isIGST ? taxAmount : 0

          return [
            index + 1,
            item.product?.name || "Product",
            item.hsn || "8471",
            item.quantity || 1,
            (item.price || 0).toFixed(2),
            taxableAmount.toFixed(2),
            `${taxRate}%`,
            isIGST ? igstAmount.toFixed(2) : cgstAmount.toFixed(2),
            isIGST ? "0.00" : sgstAmount.toFixed(2),
            (taxableAmount + taxAmount).toFixed(2),
          ]
        })
      : [[1, "Sample Product", "8471", 1, "0.00", "0.00", "18%", "0.00", "0.00", "0.00"]]

    // Table headers based on tax type
    const tableHeaders = isIGST
      ? [
          "No.",
          "Description",
          "HSN/SAC",
          "Qty",
          "Rate (₹)",
          "Amount (₹)",
          "Tax Rate",
          "IGST (₹)",
          "CGST/SGST",
          "Total (₹)",
        ]
      : [
          "No.",
          "Description",
          "HSN/SAC",
          "Qty",
          "Rate (₹)",
          "Amount (₹)",
          "Tax Rate",
          "CGST (₹)",
          "SGST (₹)",
          "Total (₹)",
        ]

    // Improved table styling with perfect alignment and increased padding
    autoTable(doc, {
      startY: yPos,
      head: [tableHeaders],
      body: itemsTableData,
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        fontSize: 8,
        halign: "center",
        valign: "middle",
        cellPadding: 3,
      },
      styles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontSize: 8,
        valign: "middle",
        cellPadding: 3,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { cellWidth: 40 },
        2: { halign: "center", cellWidth: 15 },
        3: { halign: "right", cellWidth: 10 },
        4: { halign: "right", cellWidth: 15 },
        5: { halign: "right", cellWidth: 20 },
        6: { halign: "center", cellWidth: 15 },
        7: { halign: "right", cellWidth: 15 },
        8: { halign: "right", cellWidth: 15 },
        9: { halign: "right", cellWidth: 20 },
      },
      margin: { left: margin, right: margin },
    })

    // Get the Y position after the table
    yPos = (doc as any).lastAutoTable.finalY + 5

    // Calculate totals
    const subtotal = Array.isArray(sale.items)
      ? sale.items.reduce((sum: number, item: any) => sum + (item.quantity || 0) * (item.price || 0), 0)
      : 0

    const taxRate = Array.isArray(sale.items) && sale.items.length > 0 ? sale.items[0].taxRate || 18 : 18
    const totalTax = (subtotal * taxRate) / 100
    const totalCGST = isIGST ? 0 : totalTax / 2
    const totalSGST = isIGST ? 0 : totalTax / 2
    const totalIGST = isIGST ? totalTax : 0
    const grandTotal = subtotal + totalTax
    const amountInWords = numberToWords(Math.round(grandTotal))

    // Create a 2-column layout for the bottom section
    const leftColWidth = contentWidth * 0.6
    const rightColWidth = contentWidth * 0.4

    // Amount in words box
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.1)
    doc.rect(margin, yPos, leftColWidth, 15)

    // Amount in words header
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPos, 40, 15, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text("Amount in Words:", margin + 2, yPos + 8)

    // Amount in words content
    doc.setFont("helvetica", "normal")
    doc.text(amountInWords, margin + 42, yPos + 8)

    // Summary table on right with perfect alignment
    const summaryData = [["Taxable Amount:", `₹ ${subtotal.toFixed(2)}`]]

    if (isIGST) {
      summaryData.push(["IGST:", `₹ ${totalIGST.toFixed(2)}`])
    } else {
      summaryData.push(["CGST:", `₹ ${totalCGST.toFixed(2)}`])
      summaryData.push(["SGST:", `₹ ${totalSGST.toFixed(2)}`])
    }

    summaryData.push(["Total Tax:", `₹ ${totalTax.toFixed(2)}`])
    summaryData.push(["Round Off:", `₹ ${(Math.round(grandTotal) - grandTotal).toFixed(2)}`])
    summaryData.push(["Grand Total:", `₹ ${Math.round(grandTotal).toFixed(2)}`])

    autoTable(doc, {
      startY: yPos,
      body: summaryData,
      theme: "plain",
      styles: {
        fontSize: 8,
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        minCellHeight: 5,
        cellPadding: 3,
      },
      columnStyles: {
        0: { halign: "right", fontStyle: "bold", cellWidth: 30 },
        1: { halign: "right", cellWidth: 30 },
      },
      margin: { left: margin + leftColWidth + 5, right: margin },
    })

    // Get the Y position after the summary table
    // Increased spacing before tax breakdown
    yPos += 35

    // Tax breakdown table with perfect alignment
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.1)
    doc.rect(margin, yPos, contentWidth, 25)

    // Tax breakdown header
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPos, contentWidth, 6, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("TAX BREAKDOWN", margin + 2, yPos + 4)

    // Get unique tax rates
    const taxRates = Array.isArray(sale.items)
      ? [...new Set(sale.items.map((item: any) => item.taxRate || 18))].sort((a, b) => a - b)
      : [18]

    // Create tax breakdown data
    const taxBreakdownData = taxRates.map((rate) => {
      const itemsWithRate = Array.isArray(sale.items)
        ? sale.items.filter((item: any) => (item.taxRate || 18) === rate)
        : []

      const taxableAmount = itemsWithRate.reduce((sum, item: any) => sum + (item.quantity || 0) * (item.price || 0), 0)

      if (isIGST) {
        const igstAmount = (taxableAmount * rate) / 100
        return [`${rate}%`, taxableAmount.toFixed(2), igstAmount.toFixed(2), "0.00", "0.00", igstAmount.toFixed(2)]
      } else {
        const cgstRate = rate / 2
        const sgstRate = rate / 2
        const cgstAmount = (taxableAmount * cgstRate) / 100
        const sgstAmount = (taxableAmount * sgstRate) / 100
        return [
          `${rate}%`,
          taxableAmount.toFixed(2),
          "0.00",
          cgstAmount.toFixed(2),
          sgstAmount.toFixed(2),
          (cgstAmount + sgstAmount).toFixed(2),
        ]
      }
    })

    // Add total row
    taxBreakdownData.push([
      "Total",
      subtotal.toFixed(2),
      isIGST ? totalIGST.toFixed(2) : "0.00",
      isIGST ? "0.00" : totalCGST.toFixed(2),
      isIGST ? "0.00" : totalSGST.toFixed(2),
      totalTax.toFixed(2),
    ])

    // Tax breakdown table headers
    const taxBreakdownHeaders = ["Tax Rate", "Taxable Amount", "IGST", "CGST", "SGST", "Total Tax"]

    autoTable(doc, {
      startY: yPos + 6,
      head: [taxBreakdownHeaders],
      body: taxBreakdownData,
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        fontSize: 8,
        halign: "center",
        valign: "middle",
        cellPadding: 4,
      },
      styles: {
        fontSize: 8,
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        valign: "middle",
        cellPadding: 4,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { halign: "right", cellWidth: 30 },
        2: { halign: "right", cellWidth: 30 },
        3: { halign: "right", cellWidth: 30 },
        4: { halign: "right", cellWidth: 30 },
        5: { halign: "right", cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
    })

    // Get the Y position after the tax breakdown
    yPos = (doc as any).lastAutoTable.finalY + 5

    // Bank Details and Notes in a 2-column layout with perfect alignment
    // Check if we need to add a new page
    if (yPos > 230) {
      doc.addPage()
      yPos = margin + 10

      // Add border to new page
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - margin * 2 + 4)
    }

    // Bank Details
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.1)
    doc.rect(margin, yPos, leftColWidth, 25)

    // Bank details header
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPos, leftColWidth, 6, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("BANK DETAILS", margin + 2, yPos + 4)

    // Bank details content with perfect alignment
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)

    let bankY = yPos + 10
    const bankLabelWidth = 30

    // Sample bank details
    doc.text("Account Name:", margin + 2, bankY)
    doc.text("Your Company Name", margin + 2 + bankLabelWidth, bankY)
    bankY += 4

    doc.text("Account Number:", margin + 2, bankY)
    doc.text("1234567890", margin + 2 + bankLabelWidth, bankY)
    bankY += 4

    doc.text("Bank:", margin + 2, bankY)
    doc.text("Sample Bank", margin + 2 + bankLabelWidth, bankY)
    bankY += 4

    doc.text("IFSC:", margin + 2, bankY)
    doc.text("SBIN0001234", margin + 2 + bankLabelWidth, bankY)

    // Notes
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.1)
    doc.rect(margin + leftColWidth + 5, yPos, rightColWidth - 5, 25)

    // Notes header
    doc.setFillColor(240, 240, 240)
    doc.rect(margin + leftColWidth + 5, yPos, rightColWidth - 5, 6, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("NOTES", margin + leftColWidth + 7, yPos + 4)

    // Notes content with perfect alignment
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)

    // Sample notes or use sale.notes if available
    const notes = sale.notes || "Thank you for your business!"

    // Split notes into lines
    const notesLines = doc.splitTextToSize(notes, rightColWidth - 10)
    // Limit to 4 lines max
    const limitedNotesLines = notesLines.slice(0, 4)

    let notesY = yPos + 10
    limitedNotesLines.forEach((line: string) => {
      doc.text(line, margin + leftColWidth + 7, notesY)
      notesY += 4
    })

    yPos += 30

    // Terms and Conditions with perfect alignment
    if (yPos < 240) {
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.1)
      doc.rect(margin, yPos, contentWidth, 20)

      // Terms header
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, yPos, contentWidth, 6, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.text("TERMS AND CONDITIONS", margin + 2, yPos + 4)

      // Terms content with perfect alignment
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)

      // Sample terms
      const terms =
        "1. Payment due within 30 days. 2. Goods once sold will not be taken back. 3. Interest @18% p.a. will be charged on delayed payments."

      // Split terms into lines
      const termsLines = doc.splitTextToSize(terms, contentWidth - 5)
      // Limit to 3 lines max
      const limitedTermsLines = termsLines.slice(0, 3)

      let termsY = yPos + 10
      limitedTermsLines.forEach((line: string) => {
        doc.text(line, margin + 2, termsY)
        termsY += 4
      })

      yPos += 25
    }

    // Declaration with perfect alignment
    doc.setFont("helvetica", "italic")
    doc.setFontSize(7)
    doc.text(
      "Declaration: We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.",
      margin,
      yPos,
    )

    // Signature section with perfect alignment
    yPos = Math.min(yPos + 10, 270)

    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.1)
    doc.rect(margin, yPos, contentWidth, 15)

    // For Seller text
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text(`For Your Company Name`, pageWidth - margin - 30, yPos + 5, { align: "center" })

    // Signature line
    doc.setLineWidth(0.5)
    doc.line(pageWidth - margin - 50, yPos + 10, pageWidth - margin - 10, yPos + 10)

    // Authorized signatory text
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text("Authorized Signatory", pageWidth - margin - 30, yPos + 14, { align: "center" })

    // Add footer with disclaimer
    doc.setFont("helvetica", "italic")
    doc.setFontSize(7)
    doc.setTextColor(100)
    doc.text(
      "This is a computer generated invoice and does not require a physical signature.",
      pageWidth / 2,
      pageHeight - margin - 5,
      { align: "center" },
    )

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
    return pdfBuffer
  } catch (error) {
    console.error("Error generating invoice PDF:", error)
    throw error
  }
}
