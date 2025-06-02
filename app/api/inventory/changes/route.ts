import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { connectToDatabase } from "@/lib/mongodb"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get recent inventory changes from sales and purchases
    // For this example, we'll simulate changes based on sales and purchases

    // Get recent sales (stock out)
    const recentSales = await db
      .collection("sales")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()

    // Get product details for sales
    const salesChanges = await Promise.all(
      recentSales.map(async (sale) => {
        const product = await db.collection("products").findOne({ _id: sale.productId })

        return {
          _id: sale._id.toString(),
          productName: product ? product.name : "Unknown Product",
          changeType: "Stock Out",
          quantity: sale.quantity || 1,
          timestamp: sale.createdAt,
          userName: session.user.name || "User",
        }
      }),
    )

    // Simulate some stock in changes (could be from purchases in a real app)
    const stockInChanges = [
      {
        _id: "stockin1",
        productName: "Simulated Restock",
        changeType: "Stock In",
        quantity: 10,
        timestamp: new Date().toISOString(),
        userName: session.user.name || "User",
      },
      {
        _id: "stockin2",
        productName: "Inventory Adjustment",
        changeType: "Adjustment",
        quantity: 5,
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        userName: session.user.name || "User",
      },
    ]

    // Combine and sort changes
    const changes = [...salesChanges, ...stockInChanges]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    return NextResponse.json({ changes })
  } catch (error) {
    console.error("Error fetching inventory changes:", error)
    return NextResponse.json({ error: "Failed to fetch inventory changes" }, { status: 500 })
  }
}
