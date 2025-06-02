import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { dbService } from "@/lib/db-service"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if sale exists
    const sale = await dbService.findOne("sales", { _id: saleId })

    if (!sale) {
      return NextResponse.json({ message: "Sale not found" }, { status: 404 })
    }

    // Check if sale is already completed or cancelled
    if (sale.status === "Completed") {
      return NextResponse.json({ message: "Sale is already completed" }, { status: 400 })
    }

    if (sale.status === "Cancelled") {
      return NextResponse.json({ message: "Cannot complete a cancelled sale" }, { status: 400 })
    }

    // Update inventory for each product in the sale
    const inventoryUpdates = []
    for (const item of sale.items) {
      // Get current product
      const product = await dbService.findOne("products", { _id: item.product })

      if (!product) {
        return NextResponse.json(
          {
            message: `Product ${item.productName} not found in inventory`,
          },
          { status: 400 },
        )
      }

      // Check if there's enough inventory
      const currentQuantity = product.quantity || 0
      if (currentQuantity < item.quantity) {
        return NextResponse.json(
          {
            message: `Not enough inventory for ${item.productName}. Available: ${currentQuantity}, Required: ${item.quantity}`,
          },
          { status: 400 },
        )
      }

      // Reduce inventory
      const newQuantity = currentQuantity - item.quantity

      // Update product quantity
      const updateResult = await dbService.updateOne(
        "products",
        { _id: item.product },
        {
          $set: {
            quantity: newQuantity,
            lastModified: new Date(),
            lastModifiedFrom: "sale-completion",
          },
        },
      )

      inventoryUpdates.push({
        productId: item.product,
        productName: item.productName,
        oldQuantity: currentQuantity,
        newQuantity: newQuantity,
        change: -item.quantity,
      })
    }

    // Update sale status to Completed
    await dbService.updateOne(
      "sales",
      { _id: saleId },
      {
        $set: {
          status: "Completed",
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json(
      {
        success: true,
        message: "Sale completed successfully and inventory updated",
        inventoryUpdates,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error completing sale:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to complete sale",
      },
      { status: 500 },
    )
  }
}

