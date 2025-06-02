import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/database-service"
import { getCurrentUserId } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get the latest invoice number for this user
    const latestInvoice = await db
      .collection("invoices")
      .findOne({ userId: new ObjectId(userId) }, { sort: { createdAt: -1 } })

    let nextNumber = 1
    if (latestInvoice && latestInvoice.invoiceNumber) {
      // Extract number from invoice number (e.g., "INV-2025-1036" -> 1036)
      const match = latestInvoice.invoiceNumber.match(/(\d+)$/)
      if (match) {
        nextNumber = Number.parseInt(match[1]) + 1
      }
    }

    // Generate invoice number in format INV-YYYY-NNNN
    const year = new Date().getFullYear()
    const invoiceNumber = `INV-${year}-${nextNumber.toString().padStart(4, "0")}`

    return NextResponse.json({ invoiceNumber })
  } catch (error) {
    console.error("Error generating invoice number:", error)
    return NextResponse.json({ error: "Failed to generate invoice number" }, { status: 500 })
  }
}
