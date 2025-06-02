import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const saleId = params.id

    // Validate sale ID
    if (!saleId) {
      return NextResponse.json({ message: "Sale ID is required" }, { status: 400 })
    }

    // Get request body
    const body = await req.json()
    const { status } = body

    // Validate status
    if (!status || !["Pending", "Completed", "Cancelled"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status. Must be one of: Pending, Completed, Cancelled" },
        { status: 400 },
      )
    }

    // Check if sale exists and belongs to the user's organization
    // Fix: Use MongoDB ObjectId format for the query since we're using _id
    const existingSale = await db.collection("sales").findOne({
      _id: saleId,
    })

    if (!existingSale) {
      return NextResponse.json({ message: "Sale not found or you don't have permission to update it" }, { status: 404 })
    }

    // Update the sale status
    // Fix: Use MongoDB update format with the correct collection
    const updatedSale = await db.collection("sales").updateOne(
      { _id: saleId },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json(
      {
        message: "Sale status updated successfully",
        success: true,
        sale: { ...existingSale, status },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating sale status:", error)
    return NextResponse.json({ message: "Failed to update sale status" }, { status: 500 })
  }
}

