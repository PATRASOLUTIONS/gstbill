import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const saleId = params.id
    if (!saleId) {
      return NextResponse.json({ success: false, message: "Sale ID is required" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Get the sale
    const sale = await db.collection("sales").findOne({
      _id: new ObjectId(saleId),
    })

    if (!sale) {
      return NextResponse.json({ success: false, message: "Sale not found" }, { status: 404 })
    }

    // Check if the sale is already in "Received" status
    if (sale.status === "Received") {
      return NextResponse.json({ success: false, message: "Sale is already marked as received" }, { status: 400 })
    }

    // Update the sale status to "Received"
    await db.collection("sales").updateOne({ _id: new ObjectId(saleId) }, { $set: { status: "Received" } })

    // Reduce inventory for each product in the sale
    const updatePromises = sale.items.map(async (item: any) => {
      // Get the current product
      const product = await db.collection("products").findOne({
        _id: new ObjectId(item.product),
      })

      if (!product) {
        return {
          success: false,
          productId: item.product,
          message: "Product not found",
        }
      }

      // Calculate new quantity
      const newQuantity = Math.max(0, (product.quantity || 0) - item.quantity)

      // Update product quantity
      await db.collection("products").updateOne(
        { _id: new ObjectId(item.product) },
        {
          $set: {
            quantity: newQuantity,
            lastModified: new Date(),
            lastModifiedFrom: "sales-received",
          },
        },
      )

      return {
        success: true,
        productId: item.product,
        oldQuantity: product.quantity,
        newQuantity,
      }
    })

    // Wait for all inventory updates to complete
    const results = await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: "Sale marked as received and inventory updated",
      inventoryUpdates: results,
    })
  } catch (error) {
    console.error("Error marking sale as received:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark sale as received",
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

