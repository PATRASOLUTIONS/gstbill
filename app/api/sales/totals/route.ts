import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-utils"
import { connectToDatabase } from "@/lib/database-service"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const userId = session.user.id

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculate total sales
    const totalSalesResult = await db
      .collection("sales")
      .aggregate([
        { $match: { userId: userId.toString() } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ])
      .toArray()

    // Calculate pending payments
    const pendingPaymentsResult = await db
      .collection("sales")
      .aggregate([
        {
          $match: {
            userId: userId.toString(),
            paymentStatus: { $in: ["Unpaid", "Partial"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ])
      .toArray()

    // Calculate today's sales
    const todaySalesResult = await db
      .collection("sales")
      .aggregate([
        {
          $match: {
            userId: userId.toString(),
            saleDate: { $gte: today },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ])
      .toArray()

    // Prepare response
    const response = {
      totalSales: totalSalesResult[0]?.total || 0,
      totalOrders: totalSalesResult[0]?.count || 0,
      pendingPayment: pendingPaymentsResult[0]?.total || 0,
      pendingOrders: pendingPaymentsResult[0]?.count || 0,
      todaySales: todaySalesResult[0]?.total || 0,
      todayOrders: todaySalesResult[0]?.count || 0,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching sales totals:", error)
    return NextResponse.json({ error: "Failed to fetch sales statistics" }, { status: 500 })
  }
}
