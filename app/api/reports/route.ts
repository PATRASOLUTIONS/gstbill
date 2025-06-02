import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import Sale from "@/models/sale"
import Purchase from "@/models/purchase"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = session.user.email

    // Connect to the database
    await connectToDatabase()

    // Get query parameters
    const url = new URL(req.url)
    const dateRange = url.searchParams.get("dateRange") || "thisMonth"

    // Calculate date ranges
    const now = new Date()
    let startDate: Date, endDate: Date

    switch (dateRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        break
      case "yesterday":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "thisWeek":
        const dayOfWeek = now.getDay()
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust for Sunday
        startDate = new Date(now.getFullYear(), now.getMonth(), diff)
        endDate = new Date(now.getFullYear(), now.getMonth(), diff + 7)
        break
      case "lastWeek":
        const lastWeekDayOfWeek = now.getDay()
        const lastWeekDiff = now.getDate() - lastWeekDayOfWeek - 6 // Last week's Monday
        startDate = new Date(now.getFullYear(), now.getMonth(), lastWeekDiff)
        endDate = new Date(now.getFullYear(), now.getMonth(), lastWeekDiff + 7)
        break
      case "lastMonth":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case "thisYear":
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear() + 1, 0, 0)
        break
      case "custom":
        // Handle custom date range if needed
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date()
        break
      case "thisMonth":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
    }

    // Get previous period for comparison
    const prevStartDate = new Date(startDate)
    const prevEndDate = new Date(endDate)

    // Adjust previous period based on current period
    if (dateRange === "thisMonth" || dateRange === "lastMonth") {
      prevStartDate.setMonth(prevStartDate.getMonth() - 1)
      prevEndDate.setMonth(prevEndDate.getMonth() - 1)
    } else if (dateRange === "thisYear") {
      prevStartDate.setFullYear(prevStartDate.getFullYear() - 1)
      prevEndDate.setFullYear(prevEndDate.getFullYear() - 1)
    } else {
      // For shorter periods (today, yesterday, this week, last week)
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      prevStartDate.setDate(prevStartDate.getDate() - daysDiff)
      prevEndDate.setDate(prevEndDate.getDate() - daysDiff)
    }

    try {
      // Fetch sales data for current period
      const sales = await Sale.find({
        createdBy: userEmail,
        saleDate: { $gte: startDate, $lte: endDate },
      }).lean()

      // Fetch sales data for previous period
      const prevSales = await Sale.find({
        createdBy: userEmail,
        saleDate: { $gte: prevStartDate, $lte: prevEndDate },
      }).lean()

      // Fetch purchases data for current period
      const purchases = await Purchase.find({
        createdBy: userEmail,
        purchaseDate: { $gte: startDate, $lte: endDate },
      }).lean()

      // Fetch purchases data for previous period
      const prevPurchases = await Purchase.find({
        createdBy: userEmail,
        purchaseDate: { $gte: prevStartDate, $lte: prevEndDate },
      }).lean()

      // Calculate metrics
      const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
      const prevTotalSales = prevSales.reduce((sum, sale) => sum + sale.total, 0)
      const salesGrowth = prevTotalSales ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0

      const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.purchasePrice * purchase.quantity, 0)
      const prevTotalPurchases = prevPurchases.reduce(
        (sum, purchase) => sum + purchase.purchasePrice * purchase.quantity,
        0,
      )
      const purchasesGrowth = prevTotalPurchases
        ? ((totalPurchases - prevTotalPurchases) / prevTotalPurchases) * 100
        : 0

      const profit = totalSales - totalPurchases
      const prevProfit = prevTotalSales - prevTotalPurchases
      const profitGrowth = prevProfit ? ((profit - prevProfit) / prevProfit) * 100 : 0

      const orderCount = sales.length
      const prevOrderCount = prevSales.length
      const orderGrowth = prevOrderCount ? ((orderCount - prevOrderCount) / prevOrderCount) * 100 : 0

      // Generate monthly data for charts
      const monthlyData = await generateMonthlyData(userEmail)

      // Get top selling products
      const topProducts = await getTopSellingProducts(userEmail)

      return NextResponse.json({
        metrics: {
          totalSales,
          salesGrowth,
          totalPurchases,
          purchasesGrowth,
          profit,
          profitGrowth,
          orderCount,
          orderGrowth,
        },
        monthlyData,
        topProducts,
      })
    } catch (error) {
      console.error("Error processing data:", error)
      throw error
    }
  } catch (error) {
    console.error("Error fetching reports data:", error)
    return NextResponse.json({ error: "Failed to fetch reports data" }, { status: 500 })
  }
}

async function generateMonthlyData(userEmail: string) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const monthlyData = []

  for (let i = 0; i < 12; i++) {
    const startDate = new Date(currentYear, i, 1)
    const endDate = new Date(currentYear, i + 1, 0)

    try {
      // Fetch sales for this month
      const sales = await Sale.find({
        createdBy: userEmail,
        saleDate: { $gte: startDate, $lte: endDate },
      }).lean()

      // Fetch purchases for this month
      const purchases = await Purchase.find({
        createdBy: userEmail,
        purchaseDate: { $gte: startDate, $lte: endDate },
      }).lean()

      const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
      const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.purchasePrice * purchase.quantity, 0)

      monthlyData.push({
        name: months[i],
        sales: totalSales || 0,
        purchases: totalPurchases || 0,
      })
    } catch (error) {
      console.error(`Error generating data for month ${i + 1}:`, error)
      monthlyData.push({
        name: months[i],
        sales: 0,
        purchases: 0,
      })
    }
  }

  return monthlyData
}

async function getTopSellingProducts(userEmail: string) {
  try {
    // Get all sales
    const sales = await Sale.find({ createdBy: userEmail }).lean()

    // Create a map to track product sales
    const productSales = new Map()

    // Aggregate sales by product
    for (const sale of sales) {
      for (const item of sale.items) {
        const productId = item.product.toString()
        const currentSales = productSales.get(productId) || {
          productId,
          name: item.productName,
          sales: 0,
        }
        currentSales.sales += item.total
        productSales.set(productId, currentSales)
      }
    }

    // Convert map to array and sort by sales
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    return topProducts
  } catch (error) {
    console.error("Error getting top selling products:", error)
    return []
  }
}

