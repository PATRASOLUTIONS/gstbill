import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const refund = await db.collection("refunds").findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    })

    if (!refund) {
      return NextResponse.json({ error: "Refund not found or not authorized" }, { status: 404 })
    }

    return NextResponse.json(refund)
  } catch (error) {
    console.error("Error fetching refund:", error)
    return NextResponse.json({ error: "Failed to fetch refund" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const { status } = await request.json()

    // Validate input
    if (!status || !["Approved", "Rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Get the refund
    const refund = await db.collection("refunds").findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id,
    })

    if (!refund) {
      return NextResponse.json({ error: "Refund not found or not authorized" }, { status: 404 })
    }

    // Update the refund status
    await db.collection("refunds").updateOne({ _id: new ObjectId(params.id) }, { $set: { status } })

    // If approved, update product quantities
    if (status === "Approved") {
      // Get the items from the refund
      const items = refund.items || []

      // Update product quantities
      for (const item of items) {
        await db
          .collection("products")
          .updateOne({ _id: new ObjectId(item.productId) }, { $inc: { quantity: item.quantity } })
      }
    }

    return NextResponse.json({
      message: `Refund ${status.toLowerCase()} successfully`,
    })
  } catch (error) {
    console.error("Error updating refund:", error)
    return NextResponse.json({ error: "Failed to update refund" }, { status: 500 })
  }
}
