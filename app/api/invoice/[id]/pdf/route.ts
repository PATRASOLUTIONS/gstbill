import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateInvoicePdf } from "@/utils/generate-invoice-pdf"
import { generateSimpleInvoicePdf } from "@/utils/simple-invoice-pdf"
import { inspectObject, logDetailedError } from "@/utils/debug-helpers"

// Add this helper function at the top of the file (after imports)
function safeStringify(obj: any, depth = 2): string {
  try {
    const cache: any[] = []
    const str = JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (cache.includes(value)) return "[Circular]"
          cache.push(value)

          // For arrays, limit the number of items shown
          if (Array.isArray(value) && value.length > 5) {
            return [...value.slice(0, 5), `... ${value.length - 5} more items`]
          }
        }
        return value
      },
      2,
    )
    return str
  } catch (e) {
    return `[Error stringifying object: ${e instanceof Error ? e.message : String(e)}]`
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const invoiceId = params.id
    console.log("Generating PDF for invoice ID:", invoiceId)

    // Fetch the invoice with all related data
    const invoice = await db.invoice.findUnique({
      where: {
        id: invoiceId,
        userId: session.user.id,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 })
    }

    // Fetch company details
    const company = await db.company.findFirst({
      where: {
        userId: session.user.id,
      },
    })

    // Fetch bank details
    const bankDetails = await db.bank.findFirst({
      where: {
        userId: session.user.id,
      },
    })

    // Log the structure of the invoice data for debugging
    console.log("Invoice structure:", inspectObject(invoice, 1))
    console.log("Items structure:", inspectObject(invoice.items, 2))

    // Then update the logging section before PDF generation
    // Add these lines before preparing invoiceData:

    console.log("Invoice items type:", typeof invoice.items)
    console.log("Invoice items isArray:", Array.isArray(invoice.items))
    console.log("Invoice items sample:", safeStringify(invoice.items))

    // If items is not an array, try to convert it
    if (!Array.isArray(invoice.items)) {
      console.log("Items is not an array, attempting to convert")
      try {
        if (typeof invoice.items === "object" && invoice.items !== null) {
          const itemsArray = Object.values(invoice.items)
          console.log("Converted items to array:", safeStringify(itemsArray))
          // Replace the items with our converted array
          invoice.items = itemsArray
        } else {
          console.log("Could not convert items to array, setting to empty array")
          invoice.items = []
        }
      } catch (conversionError) {
        console.error("Error converting items to array:", conversionError)
        invoice.items = []
      }
    }

    // Prepare the data for PDF generation
    const invoiceData = {
      ...invoice,
      company: company || {},
      bankDetails: bankDetails || {},
    }

    try {
      // Try to generate the PDF with the full-featured generator
      let doc
      try {
        doc = await generateInvoicePdf(invoiceData)
        console.log("Main PDF generator succeeded")
      } catch (complexError) {
        logDetailedError(complexError, "Complex PDF generation")
        console.error("Complex PDF generation failed, falling back to simple generator")
        // Fall back to the simple generator
        doc = await generateSimpleInvoicePdf(invoiceData)
        console.log("Fallback PDF generator succeeded")
      }

      // Convert the PDF to a buffer
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

      // Check if the buffer has content
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error("Generated PDF buffer is empty")
      }

      console.log("PDF buffer size:", pdfBuffer.length, "bytes")

      // Return the PDF as a response
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Invoice-${invoice.invoiceNumber || "download"}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
          // Add cache control headers to prevent caching issues
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    } catch (pdfError) {
      logDetailedError(pdfError, "PDF generation")
      return new NextResponse(
        `Error generating PDF document: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`,
        { status: 500 },
      )
    }
  } catch (error) {
    logDetailedError(error, "PDF generation API route")
    return new NextResponse("Error generating PDF: " + (error instanceof Error ? error.message : String(error)), {
      status: 500,
    })
  }
}
