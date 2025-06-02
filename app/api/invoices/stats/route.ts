import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/database-service"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get total count and amount
    const totalResult = await db
      .collection("invoices")
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: "$amount" },
          },
        },
      ])
      .toArray()

    // Get paid invoices count and amount
    const paidResult = await db
      .collection("invoices")
      .aggregate([
        { $match: { userId, status: "paid" } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: "$amount" },
          },
        },
      ])
      .toArray()

    // Get unpaid invoices count and amount (pending, overdue)
    const unpaidResult = await db
      .collection("invoices")
      .aggregate([
        { $match: { userId, status: { $in: ["pending", "overdue"] } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: "$amount" },
          },
        },
      ])
      .toArray()

    const stats = {
      totalCount: totalResult.length > 0 ? totalResult[0].count : 0,
      totalAmount: totalResult.length > 0 ? totalResult[0].total : 0,
      paidCount: paidResult.length > 0 ? paidResult[0].count : 0,
      paidAmount: paidResult.length > 0 ? paidResult[0].total : 0,
      unpaidCount: unpaidResult.length > 0 ? unpaidResult[0].count : 0,
      unpaidAmount: unpaidResult.length > 0 ? unpaidResult[0].total : 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching invoice stats:", error)
    return NextResponse.json({ error: "Failed to fetch invoice statistics" }, { status: 500 })
  }
}
