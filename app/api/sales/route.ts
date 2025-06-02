import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/auth-utils"
import dbService from "@/lib/database-service"
import { connectToDatabase } from "@/lib/database-service"

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * limit

    // Build query
    const query: any = {}

    if (status && status !== "all") {
      // Convert first letter to uppercase to match database format
      const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
      query.status = formattedStatus
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ]
    }

    // Get sales with pagination
    const sales = await dbService.find("sales", query, { sort: { createdAt: -1 }, skip, limit })

    // Get total count for pagination
    const totalSales = await dbService.count("sales", query)

    return NextResponse.json({
      sales,
      pagination: {
        total: totalSales,
        page,
        limit,
        pages: Math.ceil(totalSales / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching sales:", error)
    return NextResponse.json({ message: "An error occurred while fetching sales" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      customerName,
      customerEmail,
      customerPhone,
      products,
      totalAmount,
      paymentMethod,
      status = "Pending",
    } = body

    // Validate required fields
    if (!customerName || !products || !totalAmount || !paymentMethod) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Generate unique salesId and user-specific salesNumber
    const salesId = await dbService.generateSequentialNumber("sales", "SO-")

    // Create the sale document
    const sale = {
      salesId,
      customerName,
      customerEmail,
      customerPhone,
      products,
      totalAmount,
      paymentMethod,
      status,
    }

    // Start a transaction
    const { db, client } = await connectToDatabase()
    const session = client.startSession()

    try {
      await session.withTransaction(async () => {
        // Insert the sale
        await db.collection("sales").insertOne(
          {
            ...sale,
            userId,
            createdAt: new Date(),
          },
          { session },
        )

        // If status is "Completed", reduce product quantities
        if (status === "Completed") {
          for (const product of products) {
            const productId = dbService.toObjectId(product.productId)
            const quantity = product.quantity

            // Update product quantity
            const updateResult = await db
              .collection("products")
              .updateOne({ _id: productId, userId }, { $inc: { quantity: -quantity } }, { session })

            if (updateResult.modifiedCount === 0) {
              throw new Error(`Failed to update quantity for product ${product.productId}`)
            }

            // Check if product quantity is now below 0
            const updatedProduct = await db
              .collection("products")
              .findOne({ _id: productId, userId }, { projection: { quantity: 1 }, session })

            if (updatedProduct && updatedProduct.quantity < 0) {
              throw new Error(`Insufficient quantity for product ${product.productId}`)
            }
          }
        }
      })

      return NextResponse.json(
        {
          message: "Sale created successfully",
          salesId,
        },
        { status: 201 },
      )
    } finally {
      await session.endSession()
    }
  } catch (error) {
    console.error("Error creating sale:", error)
    return NextResponse.json({ message: "An error occurred while creating the sale" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Sale ID is required" }, { status: 400 })
    }

    const data = await request.json()

    // Update sale
    const result = await dbService.updateOne(
      "sales",
      { _id: dbService.toObjectId(id) },
      { $set: { ...data, lastModified: new Date() } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Sale not found or you don't have permission to update it" }, { status: 404 })
    }

    return NextResponse.json({ message: "Sale updated successfully" })
  } catch (error) {
    console.error("Error updating sale:", error)
    return NextResponse.json(
      { message: "An error occurred while updating the sale", error: error.message },
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Sale ID is required" }, { status: 400 })
    }

    // Delete sale
    const result = await dbService.deleteOne("sales", {
      _id: dbService.toObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Sale not found or you don't have permission to delete it" }, { status: 404 })
    }

    return NextResponse.json({ message: "Sale deleted successfully" })
  } catch (error) {
    console.error("Error deleting sale:", error)
    return NextResponse.json(
      { message: "An error occurred while deleting the sale", error: error.message },
      { status: 500 },
    )
  }
}
