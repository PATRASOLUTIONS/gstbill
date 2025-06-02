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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const search = searchParams.get("search") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    const { db } = await connectToDatabase()

    // Build query
    const query: any = { userId: new ObjectId(userId) }

    if (status) {
      query.status = status
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.email": { $regex: search, $options: "i" } },
      ]
    }

    const invoices = await db
      .collection("invoices")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    console.log("Creating invoice with data:", data)

    // Validate required fields
    if (!data.invoiceNumber || !data.customer || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if invoice number already exists for this user
    const existingInvoice = await db.collection("invoices").findOne({
      userId: new ObjectId(userId),
      invoiceNumber: data.invoiceNumber,
    })

    if (existingInvoice) {
      return NextResponse.json({ error: "Invoice number already exists" }, { status: 400 })
    }

    // Update product stock for each item
    const stockUpdates = []
    for (const item of data.items) {
      try {
        const productId = new ObjectId(item.productId)

        // Check current stock
        const product = await db.collection("products").findOne({
          _id: productId,
          userId: new ObjectId(userId),
        })

        if (!product) {
          return NextResponse.json(
            {
              error: `Product ${item.productName} not found`,
            },
            { status: 404 },
          )
        }

        if (product.stock < item.quantity) {
          return NextResponse.json(
            {
              error: `Insufficient stock for ${item.productName}. Available: ${product.stock}, Required: ${item.quantity}`,
            },
            { status: 400 },
          )
        }

        // Update stock
        const updateResult = await db.collection("products").updateOne(
          { _id: productId, userId: new ObjectId(userId) },
          {
            $inc: { stock: -item.quantity },
            $set: {
              updatedAt: new Date(),
              lastModified: new Date(),
              lastModifiedFrom: "invoice-creation",
            },
          },
        )

        stockUpdates.push({
          productId: item.productId,
          productName: item.productName,
          quantityReduced: item.quantity,
          updateResult: updateResult.modifiedCount,
        })

        console.log(`Updated stock for ${item.productName}: reduced by ${item.quantity}`)
      } catch (error) {
        console.error(`Error updating stock for product ${item.productId}:`, error)
        return NextResponse.json(
          {
            error: `Failed to update stock for ${item.productName}`,
          },
          { status: 500 },
        )
      }
    }

    // Create the invoice
    const invoiceData = {
      ...data,
      userId: new ObjectId(userId),
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      stockUpdates, // Store which products had stock updated
    }

    const result = await db.collection("invoices").insertOne(invoiceData)

    // Create activity log
    try {
      await db.collection("activity_logs").insertOne({
        userId: new ObjectId(userId),
        action: "create",
        resourceType: "invoice",
        resourceId: result.insertedId,
        details: {
          invoiceNumber: data.invoiceNumber,
          total: data.total,
          customerName: data.customer.name,
          itemsCount: data.items.length,
        },
        timestamp: new Date(),
      })
    } catch (logError) {
      console.error("Error creating activity log:", logError)
      // Don't fail the invoice creation if logging fails
    }

    console.log("Invoice created successfully:", {
      invoiceId: result.insertedId,
      invoiceNumber: data.invoiceNumber,
      stockUpdates,
    })

    return NextResponse.json({
      _id: result.insertedId,
      invoiceNumber: data.invoiceNumber,
      message: "Invoice created successfully",
      stockUpdates,
    })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json(
      {
        error: "Failed to create invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
