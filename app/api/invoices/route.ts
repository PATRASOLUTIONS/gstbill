import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/database-service"
import { getCurrentUserId } from "@/lib/auth-utils"

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
    const query: any = { userId }

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

    const invoices = await db.collection("invoices").find(query).sort({ date: -1 }).skip(skip).limit(limit).toArray()

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

    // Validate required fields
    if (!data.invoiceNumber || !data.customer || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get customer details
    const customer = await db.collection("customers").findOne({ _id: data.customer })
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Update product stock
    const bulkOps = data.items.map((item: any) => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { stock: -item.quantity } },
      },
    }))

    await db.collection("products").bulkWrite(bulkOps)

    // Add userId and timestamps to the invoice data
    const invoiceData = {
      ...data,
      userId,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        address: customer.address,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("invoices").insertOne(invoiceData)

    // Create activity log
    await db.collection("activity_logs").insertOne({
      userId,
      action: "create",
      resourceType: "invoice",
      resourceId: result.insertedId,
      details: {
        invoiceNumber: data.invoiceNumber,
        total: data.total,
      },
      timestamp: new Date(),
    })

    return NextResponse.json({
      _id: result.insertedId,
      ...invoiceData,
    })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}

