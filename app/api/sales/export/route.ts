import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { handleApiError } from "@/lib/api-utils"
import { connectToDatabase } from "@/lib/mongodb"
import Sale from "@/models/sale"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")
    const paymentStatus = searchParams.get("paymentStatus")

    await connectToDatabase()

    // Build query
    const query: any = {
      createdBy: session.user.email,
    }

    // Add date range filter
    if (startDate || endDate) {
      query.saleDate = {}
      if (startDate) query.saleDate.$gte = startDate
      if (endDate) query.saleDate.$lte = endDate
    }

    // Add status filter
    if (status && status !== "all") {
      query.status = status
    }

    // Add payment status filter
    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus
    }

    // Fetch sales data
    const sales = await Sale.find(query).populate("customer", "name email contact").sort({ createdAt: -1 }).lean()

    // Format data for CSV export
    const formattedSales = sales.map((sale) => ({
      _id: sale._id.toString(),
      saleDate: sale.saleDate,
      customerName: sale.customer?.name || "Unknown Customer",
      customerEmail: sale.customer?.email || "",
      customerContact: sale.customer?.contact || "",
      status: sale.status,
      paymentStatus: sale.paymentStatus,
      subtotal: sale.subtotal,
      taxTotal: sale.taxTotal,
      total: sale.total,
      createdAt: new Date(sale.createdAt).toISOString().split("T")[0],
    }))

    return NextResponse.json({
      success: true,
      sales: formattedSales,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

