import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
      return NextResponse.json({ message: "Sale not found or you don't have permission to delete it" }, { status: 404 })
    }

    // Delete the sale
    await db.sale.delete({
      where: {
        id: saleId,
      },
    })

    return NextResponse.json({ message: "Sale deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting sale:", error)
    return NextResponse.json({ message: "Failed to delete sale" }, { status: 500 })
  }
}

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

    // Fetch the sale with related data
    const sale = await db.sale.findUnique({
      where: {
        id: saleId,
        user: {
          id: session.user.id,
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        invoice: true,
      },
    })

    if (!sale) {
      return NextResponse.json({ message: "Sale not found or you don't have permission to view it" }, { status: 404 })
    }

    return NextResponse.json(sale, { status: 200 })
  } catch (error) {
    console.error("Error fetching sale:", error)
    return NextResponse.json({ message: "Failed to fetch sale details" }, { status: 500 })
  }
}

