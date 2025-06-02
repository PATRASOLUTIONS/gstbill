import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/auth-utils"
import dbService from "@/lib/database-service"

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""

    const skip = (page - 1) * limit

    // Build the query
    const query: any = {}

    // Add status filter if provided and not "all"
    if (status && status !== "all") {
      query.status = status
    }

    // Add search query if provided
    if (search) {
      query.$or = [{ purchaseId: { $regex: search, $options: "i" } }, { supplier: { $regex: search, $options: "i" } }]
    }

    // Get purchases with pagination
    const purchases = await dbService.find("purchases", query, { sort: { date: -1 }, skip, limit })

    // Get total count for pagination
    const totalCount = await dbService.count("purchases", query)

    return NextResponse.json({
      purchases,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("Error in purchases API:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to fetch purchases" }), { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const data = await req.json()

    // Generate a user-specific purchase ID
    const purchaseId = await dbService.generateSequentialNumber("purchases", "PO-")

    // Add purchaseId to the data
    const purchaseData = {
      ...data,
      purchaseId,
      date: new Date(data.date || Date.now()),
    }

    // Create the purchase with user association
    const result = await dbService.create("purchases", purchaseData)

    return NextResponse.json({
      success: true,
      purchase: {
        _id: result.id,
        ...purchaseData,
      },
    })
  } catch (error) {
    console.error("Error creating purchase:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to create purchase" }), { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Purchase ID is required" }, { status: 400 })
    }

    const data = await request.json()

    // Update purchase
    const result = await dbService.updateOne(
      "purchases",
      { _id: dbService.toObjectId(id) },
      { $set: { ...data, lastModified: new Date() } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Purchase not found or you don't have permission to update it" },
        { status: 404 },
      )
    }

    return NextResponse.json({ message: "Purchase updated successfully" })
  } catch (error) {
    console.error("Error updating purchase:", error)
    return NextResponse.json(
      { message: "An error occurred while updating the purchase", error: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Purchase ID is required" }, { status: 400 })
    }

    // Delete purchase
    const result = await dbService.deleteOne("purchases", {
      _id: dbService.toObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Purchase not found or you don't have permission to delete it" },
        { status: 404 },
      )
    }

    return NextResponse.json({ message: "Purchase deleted successfully" })
  } catch (error) {
    console.error("Error deleting purchase:", error)
    return NextResponse.json(
      { message: "An error occurred while deleting the purchase", error: error.message },
      { status: 500 },
    )
  }
}
