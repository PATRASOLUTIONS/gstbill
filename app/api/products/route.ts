import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/auth-utils"
import dbService from "@/lib/database-service"

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const query = searchParams.get("query") || ""
    const category = searchParams.get("category") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // If ID is provided, return a single product
    if (id) {
      const product = await dbService.findOne("products", {
        _id: dbService.toObjectId(id),
      })

      if (!product) {
        return NextResponse.json({ message: "Product not found" }, { status: 404 })
      }
      return NextResponse.json(product)
    }

    // Build query
    const queryObj: any = {}
    if (query) {
      queryObj.$or = [
        { name: { $regex: query, $options: "i" } },
        { sku: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ]
    }
    if (category && category !== "all") {
      queryObj.category = category
    }

    // Get products
    const products = await dbService.find("products", queryObj, { sort: { createdAt: -1 }, skip, limit })

    // Get total count for pagination
    const totalProducts = await dbService.count("products", queryObj)

    return NextResponse.json({
      products,
      pagination: {
        total: totalProducts,
        page,
        limit,
        pages: Math.ceil(totalProducts / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ message: "An error occurred while fetching products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Check if SKU already exists for this user
    const existingSku = await dbService.findOne("products", {
      sku: data.sku,
    })

    if (existingSku) {
      return NextResponse.json(
        {
          message: "A product with this SKU already exists",
          error: "Duplicate SKU",
          code: "DUPLICATE_SKU",
        },
        { status: 400 },
      )
    }

    // Create product with user association and sequential number
    const result = await dbService.create("products", data)

    return NextResponse.json({
      message: "Product created successfully",
      productId: result.id,
      productNo: result.sequentialNumber,
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { message: "An error occurred while creating the product", error: error.message },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 })
    }

    const data = await request.json()

    // Check if updating SKU and if it already exists
    if (data.sku) {
      const existingSku = await dbService.findOne("products", {
        sku: data.sku,
        _id: { $ne: dbService.toObjectId(id) },
      })

      if (existingSku) {
        return NextResponse.json(
          {
            message: "A product with this SKU already exists",
            error: "Duplicate SKU",
            code: "DUPLICATE_SKU",
          },
          { status: 400 },
        )
      }
    }

    // Update product
    const result = await dbService.updateOne(
      "products",
      { _id: dbService.toObjectId(id) },
      { $set: { ...data, lastModified: new Date() } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Product not found or you don't have permission to update it" },
        { status: 404 },
      )
    }

    return NextResponse.json({ message: "Product updated successfully" })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { message: "An error occurred while updating the product", error: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 })
    }

    // Delete product only if it belongs to the user
    const result = await dbService.deleteOne("products", {
      _id: dbService.toObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Product not found or you don't have permission to delete it" },
        { status: 404 },
      )
    }

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { message: "An error occurred while deleting the product", error: error.message },
      { status: 500 },
    )
  }
}

