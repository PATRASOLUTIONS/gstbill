import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/database-service"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get the current year
    const currentYear = new Date().getFullYear()

    // Find the latest invoice number for this year
    const latestInvoice = await db
      .collection("invoices")
      .find({
        userId,
        invoiceNumber: { $regex: `INV-${currentYear}-` },
      })
      .sort({ invoiceNumber: -1 })
      .limit(1)
      .toArray()

    let nextNumber = 1

    if (latestInvoice.length > 0) {
      // Extract the number from the latest invoice number
      const latestNumber = latestInvoice[0].invoiceNumber.split("-")[2]
      nextNumber = Number.parseInt(latestNumber) + 1
    }

    // Format the invoice number with leading zeros (4 digits)
    const invoiceNumber = `INV-${currentYear}-${nextNumber.toString().padStart(4, "0")}`

    return NextResponse.json({ invoiceNumber })
  } catch (error) {
    console.error("Error generating invoice number:", error)
    return NextResponse.json({ error: "Failed to generate invoice number" }, { status: 500 })
  }
}
