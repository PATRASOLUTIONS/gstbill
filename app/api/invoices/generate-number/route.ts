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
      // Extract number from invoice number (e.g., "INV-2025-0001" -> 1)
      const match = latestInvoice.invoiceNumber.match(/INV-\d{4}-(\d+)/)
      if (match) {
        nextNumber = Number.parseInt(match[1]) + 1
      }
    }

    const currentYear = new Date().getFullYear()
    const invoiceNumber = `INV-${currentYear}-${nextNumber.toString().padStart(4, "0")}`

    console.log("Generated invoice number:", invoiceNumber)

    return NextResponse.json({ invoiceNumber })
  } catch (error) {
    console.error("Error generating invoice number:", error)

    // Fallback to timestamp-based number
    const fallbackNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`

    return NextResponse.json({ invoiceNumber: fallbackNumber })
  }
}
