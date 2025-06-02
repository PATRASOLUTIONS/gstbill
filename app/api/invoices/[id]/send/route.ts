import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/database-service"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = params.id
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if invoice exists and belongs to user
    const invoice = await db.collection("invoices").findOne({
      _id: new ObjectId(id),
      userId,
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // In a real application, you would send the invoice via email here
    // For now, we'll just update the invoice to mark it as sent

    await db.collection("invoices").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          sentAt: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending invoice:", error)
    return NextResponse.json({ error: "Failed to send invoice" }, { status: 500 })
  }
}
