import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Validate ID format
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid refund ID format" }, { status: 400 })
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { status } = body

    if (!status || !["pending", "approved", "rejected", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Find the refund
    const refund = await db.collection("refunds").findOne({
      _id: new ObjectId(id),
    })

    if (!refund) {
      return NextResponse.json({ error: "Refund not found" }, { status: 404 })
    }

    // Validate status transition
    const validTransitions = {
      pending: ["approved", "rejected"],
      approved: ["completed", "rejected"],
      rejected: [],
      completed: [],
    }

    if (!validTransitions[refund.status]?.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${refund.status} to ${status}`,
        },
        { status: 400 },
      )
    }

    // Update the refund status
    const result = await db.collection("refunds").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        },
      },
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update refund status" }, { status: 500 })
    }

    // If status is completed, we might need to update related records
    if (status === "completed") {
      // This would depend on your business logic
      // For example, you might want to update the sale or purchase record
      // to reflect that a refund has been processed

      // Log the completion for audit purposes
      await db.collection("activityLogs").insertOne({
        action: "refund_completed",
        refundId: id,
        userId: session.user.id,
        timestamp: new Date(),
        details: {
          refundAmount: refund.amount,
          refundType: refund.type,
          referenceId: refund.sale || refund.purchase,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Refund status updated successfully",
    })
  } catch (error) {
    console.error("Error updating refund status:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}

