import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if sale exists and belongs to the user's organization
    const existingSale = await db.sale.findUnique({
      where: {
        id: saleId,
        user: {
          id: session.user.id,
        },
      },
    })

    if (!existingSale) {
      return NextResponse.json({ message: "Sale not found or you don't have permission to access it" }, { status: 404 })
    }

    return NextResponse.json({ message: "Access verified", hasAccess: true }, { status: 200 })
  } catch (error) {
    console.error("Error verifying sale access:", error)
    return NextResponse.json({ message: "Failed to verify access" }, { status: 500 })
  }
}

