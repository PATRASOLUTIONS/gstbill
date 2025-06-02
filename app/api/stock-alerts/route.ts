import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import Product from "@/models/product"
import { handleApiError } from "@/lib/api-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const status = searchParams.get("status") || ""
    const sort = searchParams.get("sort") || "name"
    const order = searchParams.get("order") || "asc"

    await connectToDatabase()

    // Get all products
    const query: any = {
      createdBy: session.user.email,
    }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { sku: { $regex: search, $options: "i" } }]
    }

    if (category) {
      query.category = category
    }

    // Get all products
    const products = await Product.find(query).populate("supplierID", "name").lean()

    // Calculate stock status for each product
    const stockAlerts = products.map((product) => {
      // Calculate status based on percentage of 100
      const stockPercentage = (product.quantity / 100) * 100

      let stockStatus = "OK"
      if (stockPercentage <= 15) {
        stockStatus = "Critical"
      } else if (stockPercentage <= 30) {
        stockStatus = "Low"
      } else if (stockPercentage <= 50) {
        stockStatus = "Reorder Soon"
      }

      return {
        id: product._id.toString(),
        productId: product._id.toString(),
        productName: product.name,
        sku: product.sku,
        category: product.category,
        currentStock: product.quantity,
        maxStock: 100, // Fixed value of 100
        supplier: product.supplierID ? product.supplierID.name : "Unknown",
        status: stockStatus,
        createdAt: product.createdAt,
      }
    })

    // Filter by status if provided
    let filteredAlerts = stockAlerts
    if (status && status !== "all") {
      filteredAlerts = stockAlerts.filter((alert) => alert.status === status)
    }

    // Sort the results
    filteredAlerts.sort((a, b) => {
      let comparison = 0

      if (sort === "currentStock") {
        comparison = a.currentStock - b.currentStock
      } else if (sort === "status") {
        const statusOrder = { Critical: 0, Low: 1, "Reorder Soon": 2, OK: 3 }
        comparison =
          statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
      } else if (sort === "productName") {
        comparison = a.productName.localeCompare(b.productName)
      } else if (sort === "category") {
        comparison = a.category.localeCompare(b.category)
      } else if (sort === "sku") {
        comparison = a.sku.localeCompare(b.sku)
      } else if (sort === "supplier") {
        comparison = a.supplier.localeCompare(b.supplier)
      }

      return order === "desc" ? -comparison : comparison
    })

    // Paginate the results
    const paginatedAlerts = filteredAlerts.slice(skip, skip + limit)

    // Get counts for each status
    const criticalCount = filteredAlerts.filter((alert) => alert.status === "Critical").length
    const lowCount = filteredAlerts.filter((alert) => alert.status === "Low").length
    const reorderSoonCount = filteredAlerts.filter((alert) => alert.status === "Reorder Soon").length

    return NextResponse.json({
      alerts: paginatedAlerts,
      counts: {
        critical: criticalCount,
        low: lowCount,
        reorderSoon: reorderSoonCount,
        total: filteredAlerts.length,
      },
      pagination: {
        total: filteredAlerts.length,
        page,
        limit,
        pages: Math.ceil(filteredAlerts.length / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
