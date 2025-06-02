import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const productId = params.id

    // Validate product ID
    if (!productId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 })
    }

    // Get request body
    const body = await req.json()
    const { quantity, lastModified, lastModifiedFrom } = body

    // Validate quantity
    if (quantity === undefined || quantity < 0) {
      return NextResponse.json({ message: "Invalid quantity. Must be a non-negative number" }, { status: 400 })
    }

    // Check if product exists and belongs to the user's organization
    const existingProduct = await db.product.findUnique({
      where: {
        id: productId,
        user: {
          id: session.user.id,
        },
      },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { message: "Product not found or you don't have permission to update it" },
        { status: 404 },
      )
    }

    // Update the product quantity
    const updatedProduct = await db.product.update({
      where: {
        id: productId,
      },
      data: {
        quantity,
        lastModified: lastModified || new Date(),
        lastModifiedFrom: lastModifiedFrom || "manual-update",
      },
    })

    return NextResponse.json(
      { message: "Product quantity updated successfully", product: updatedProduct },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating product quantity:", error)
    return NextResponse.json({ message: "Failed to update product quantity" }, { status: 500 })
  }
}

