import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { createInvoicePDF } from "@/lib/generate-invoice-pdf"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Fetch the invoice
    const invoice = await db.collection("invoices").findOne({
      _id: new ObjectId(id),
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Fetch the customer
    let customer = null
    if (invoice.customerId && invoice.customerId !== "walkin") {
      customer = await db.collection("customers").findOne({
        _id: new ObjectId(invoice.customerId),
      })
    } else {
      // For walk-in customers, create a basic customer object
      customer = {
        name: invoice.customerName || "Walk-in Customer",
        address: invoice.customerAddress || [],
        email: invoice.customerEmail || "",
        contact: invoice.customerContact || "",
      }
    }

    // Fetch company details
    const company = await db.collection("companies").findOne({
      userId: invoice.userId,
    })

    // Fetch bank details
    const bank = await db.collection("banks").findOne({
      userId: invoice.userId,
    })

    // Generate the PDF
    const pdfDoc = await createInvoicePDF({ invoice, customer, company, bank })
    const pdfBuffer = pdfDoc.output("arraybuffer")

    // Return the PDF as a downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating invoice PDF:", error)
    return NextResponse.json(
      {
        error: "Failed to generate invoice PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
