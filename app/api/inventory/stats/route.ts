import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { connectToDatabase } from "@/lib/mongodb"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get all products for the user
    const products = await db.collection("products").find({ userId: session.user.id }).toArray()

    // Calculate total value
    const totalValue = products.reduce((sum, product) => {
      return sum + (product.quantity || 0) * (product.price || 0)
    }, 0)

    // Get products from 30 days ago for comparison
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const oldProducts = await db
      .collection("products")
      .find({
        userId: session.user.id,
        createdAt: { $lt: thirtyDaysAgo.toISOString() },
      })
      .toArray()

    const oldTotalValue = oldProducts.reduce((sum, product) => {
      return sum + (product.quantity || 0) * (product.price || 0)
    }, 0)

    // Calculate low stock items
    const lowStockItems = products.filter(
      (product) => (product.quantity || 0) <= (product.reorderLevel || 5) && (product.quantity || 0) > 0,
    ).length

    // Calculate out of stock items (reorder needed)
    const reorderNeeded = products.filter((product) => (product.quantity || 0) === 0).length

    // Get products from 7 days ago for weekly comparison
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const weekOldProducts = await db
      .collection("products")
      .find({
        userId: session.user.id,
        createdAt: { $lt: sevenDaysAgo.toISOString() },
      })
      .toArray()

    const oldLowStockItems = weekOldProducts.filter(
      (product) => (product.quantity || 0) <= (product.reorderLevel || 5) && (product.quantity || 0) > 0,
    ).length

    const oldReorderNeeded = weekOldProducts.filter((product) => (product.quantity || 0) === 0).length

    // Calculate growth percentages
    const valueGrowthPercent = oldTotalValue > 0 ? ((totalValue - oldTotalValue) / oldTotalValue) * 100 : 0

    const stats = {
      totalProducts: products.length,
      totalValue,
      lowStockItems,
      reorderNeeded,
      monthlyGrowth: {
        products: products.length - oldProducts.length,
        value: valueGrowthPercent,
      },
      weeklyChange: {
        lowStock: lowStockItems - oldLowStockItems,
        reorderNeeded: reorderNeeded - oldReorderNeeded,
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching inventory stats:", error)
    return NextResponse.json({ error: "Failed to fetch inventory stats" }, { status: 500 })
  }
}
