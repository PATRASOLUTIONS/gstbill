import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get the current year
    const currentYear = new Date().getFullYear()

    // Find the highest sale number for this user and year
    const latestSale = await db
      .collection("sales")
      .find({
        userId: new ObjectId(session.user.id),
        saleId: { $regex: `SAL-${currentYear}-` },
      })
      .sort({ saleId: -1 })
      .limit(1)
      .toArray()

    let nextNumber = 1

    if (latestSale.length > 0) {
      // Extract the number part from the latest sale ID
      const latestIdMatch = latestSale[0].saleId.match(/SAL-\d{4}-(\d{4})/)
      if (latestIdMatch && latestIdMatch[1]) {
        nextNumber = Number.parseInt(latestIdMatch[1]) + 1
      }
    }

    // Format the next sale ID
    const nextSaleId = `SAL-${currentYear}-${nextNumber.toString().padStart(4, "0")}`

    return NextResponse.json({ nextSaleId })
  } catch (error) {
    console.error("Error generating next sale ID:", error)
    return NextResponse.json({ error: "Failed to generate next sale ID" }, { status: 500 })
  }
}
