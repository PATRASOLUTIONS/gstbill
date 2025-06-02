import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getNextSalesNumber } from "@/lib/sales-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id || session.user.email
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 })
    }

    const nextSalesNumber = await getNextSalesNumber(userId)

    return NextResponse.json({ nextSalesNumber })
  } catch (error) {
    console.error("Error getting next sales number:", error)
    return NextResponse.json({ error: "Failed to get next sales number" }, { status: 500 })
  }
}

