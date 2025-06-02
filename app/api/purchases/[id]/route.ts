import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/database-service"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const id = params.id
    if (!ObjectId.isValid(id)) {
      return new NextResponse(JSON.stringify({ error: "Invalid purchase ID" }), { status: 400 })
    }

    const { db } = await connectToDatabase()

    const purchase = await db.collection("purchases").findOne({
      _id: new ObjectId(id),
      userId,
    })

    if (!purchase) {
      return new NextResponse(JSON.stringify({ error: "Purchase not found" }), { status: 404 })
    }

    return NextResponse.json({ purchase })
  } catch (error) {
    console.error("Error fetching purchase:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to fetch purchase" }), { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const id = params.id
    if (!ObjectId.isValid(id)) {
      return new NextResponse(JSON.stringify({ error: "Invalid purchase ID" }), { status: 400 })
    }

    const { db } = await connectToDatabase()
    const data = await req.json()

    // Remove fields that shouldn't be updated
    delete data._id
    delete data.userId
    delete data.purchaseId
    delete data.createdAt

    // Update the purchase
    const result = await db.collection("purchases").updateOne(
      { _id: new ObjectId(id), userId },
      {
        $set: {
          ...data,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return new NextResponse(JSON.stringify({ error: "Purchase not found" }), { status: 404 })
    }

    const updatedPurchase = await db.collection("purchases").findOne({
      _id: new ObjectId(id),
    })

    return NextResponse.json({
      success: true,
      purchase: updatedPurchase,
    })
  } catch (error) {
    console.error("Error updating purchase:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to update purchase" }), { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const id = params.id
    if (!ObjectId.isValid(id)) {
      return new NextResponse(JSON.stringify({ error: "Invalid purchase ID" }), { status: 400 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("purchases").deleteOne({
      _id: new ObjectId(id),
      userId,
    })

    if (result.deletedCount === 0) {
      return new NextResponse(JSON.stringify({ error: "Purchase not found" }), { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Purchase deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting purchase:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to delete purchase" }), { status: 500 })
  }
}
