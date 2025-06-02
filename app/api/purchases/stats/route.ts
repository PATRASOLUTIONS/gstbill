import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/database-service"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get aggregate statistics for purchases
    const stats = await db
      .collection("purchases")
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            value: { $sum: "$total" },
          },
        },
      ])
      .toArray()

    // Initialize result object with default values
    const result = {
      total: { count: 0, value: 0 },
      draft: { count: 0, value: 0 },
      ordered: { count: 0, value: 0 },
      received: { count: 0, value: 0 },
    }

    // Calculate total from all statuses
    let totalCount = 0
    let totalValue = 0

    // Populate result with actual values from database
    stats.forEach((stat) => {
      const status = stat._id as string
      result[status as keyof typeof result] = {
        count: stat.count,
        value: stat.value,
      }

      totalCount += stat.count
      totalValue += stat.value
    })

    // Set the total values
    result.total = {
      count: totalCount,
      value: totalValue,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in purchases stats API:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to fetch purchase statistics" }), { status: 500 })
  }
}

