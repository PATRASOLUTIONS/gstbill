import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const { db } = await connectToDatabase()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // If ID is provided, return a single refund
    if (id) {
      const refund = await db.collection("refunds").findOne({
        _id: new ObjectId(id),
        userId: userId,
      })

      if (!refund) {
        return NextResponse.json({ message: "Refund not found" }, { status: 404 })
      }
      return NextResponse.json({ refund })
    }

    // Build query
    const queryObj: any = { userId: userId }
    if (status && status !== "all") {
      queryObj.status = status
    }

    // Get refunds
    const refunds = await db
      .collection("refunds")
      .find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const totalRefunds = await db.collection("refunds").countDocuments(queryObj)

    return NextResponse.json({
      refunds,
      pagination: {
        total: totalRefunds,
        page,
        limit,
        pages: Math.ceil(totalRefunds / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching refunds:", error)
    return NextResponse.json({ message: "An error occurred while fetching refunds" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const { db } = await connectToDatabase()
    const data = await request.json()

    // Add user ID and created by
    const refundData = {
      ...data,
      userId: userId,
      createdBy: session.user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("refunds").insertOne(refundData)
    return NextResponse.json({ message: "Refund created successfully", refundId: result.insertedId })
  } catch (error) {
    console.error("Error creating refund:", error)
    return NextResponse.json(
      { message: "An error occurred while creating the refund", error: error.message },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const { db } = await connectToDatabase()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Refund ID is required" }, { status: 400 })
    }

    const data = await request.json()

    // Update refund only if it belongs to the user
    const result = await db
      .collection("refunds")
      .updateOne({ _id: new ObjectId(id), userId: userId }, { $set: { ...data, updatedAt: new Date() } })

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Refund not found or you don't have permission to update it" },
        { status: 404 },
      )
    }

    return NextResponse.json({ message: "Refund updated successfully" })
  } catch (error) {
    console.error("Error updating refund:", error)
    return NextResponse.json(
      { message: "An error occurred while updating the refund", error: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const { db } = await connectToDatabase()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Refund ID is required" }, { status: 400 })
    }

    // Delete refund only if it belongs to the user
    const result = await db.collection("refunds").deleteOne({
      _id: new ObjectId(id),
      userId: userId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Refund not found or you don't have permission to delete it" },
        { status: 404 },
      )
    }

    return NextResponse.json({ message: "Refund deleted successfully" })
  } catch (error) {
    console.error("Error deleting refund:", error)
    return NextResponse.json(
      { message: "An error occurred while deleting the refund", error: error.message },
      { status: 500 },
    )
  }
}
