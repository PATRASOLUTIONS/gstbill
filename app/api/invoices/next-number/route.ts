import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const client = await clientPromise
    const db = client.db()

    const currentYear = new Date().getFullYear()

    // Get the current counter value
    const counter = await db.collection("invoiceCounters").findOne({
      userId: userId,
      year: currentYear,
    })

    // Calculate the next invoice number
    let nextSequence = 1
    if (counter && counter.sequence) {
      nextSequence = counter.sequence + 1
    }

    const nextInvoiceNumber = `INV-${currentYear}-${nextSequence.toString().padStart(4, "0")}`

    return NextResponse.json({ nextInvoiceNumber })
  } catch (error) {
    console.error("Error getting next invoice number:", error)
    return NextResponse.json({ error: "Failed to get next invoice number" }, { status: 500 })
  }
}

