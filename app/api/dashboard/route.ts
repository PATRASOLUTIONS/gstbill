import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Dashboard API: User session", {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    })

    // Connect to MongoDB directly
    const client = await clientPromise
    const db = client.db()

    // Try different user identifiers to find matching records
    const userId = session.user.id
    const userEmail = session.user.email
    const userName = session.user.name

    console.log("Querying with user identifiers:", { userId, userEmail, userName })

    // Get collection names to verify they exist
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)
    console.log("Available collections:", collectionNames)

    // Get a sample document from each collection to check field names
    let sampleProduct = null
    let samplePurchase = null
    let sampleSale = null
    let sampleInvoice = null

    try {
      if (collectionNames.includes("products")) {
        sampleProduct = await db.collection("products").findOne({})
        console.log("Sample product fields:", sampleProduct ? Object.keys(sampleProduct) : "No products found")
      }

      if (collectionNames.includes("purchases")) {
        samplePurchase = await db.collection("purchases").findOne({})
        console.log("Sample purchase fields:", samplePurchase ? Object.keys(samplePurchase) : "No purchases found")
      }

      if (collectionNames.includes("sales")) {
        sampleSale = await db.collection("sales").findOne({})
        console.log("Sample sale fields:", sampleSale ? Object.keys(sampleSale) : "No sales found")
        console.log("Sample sale document:", sampleSale)
      }

      if (collectionNames.includes("invoices")) {
        sampleInvoice = await db.collection("invoices").findOne({})
        console.log("Sample invoice fields:", sampleInvoice ? Object.keys(sampleInvoice) : "No invoices found")
      }
    } catch (error) {
      console.error("Error fetching sample documents:", error)
    }

    // Build queries based on available fields
    const productQuery = buildQuery(sampleProduct, userId, userEmail, userName)
    const purchaseQuery = buildQuery(samplePurchase, userId, userEmail, userName)
    const saleQuery = buildQuery(sampleSale, userId, userEmail, userName)
    const invoiceQuery = buildQuery(sampleInvoice, userId, userEmail, userName)

    console.log("Queries:", {
      productQuery,
      purchaseQuery,
      saleQuery,
      invoiceQuery,
    })

    // Get total products
    let totalProducts = 0
    if (collectionNames.includes("products")) {
      totalProducts = await db.collection("products").countDocuments(productQuery)
    }
    console.log("Total Products:", totalProducts)

    // Get total purchases
    let totalPurchases = 0
    if (collectionNames.includes("purchases")) {
      totalPurchases = await db.collection("purchases").countDocuments(purchaseQuery)
    }
    console.log("Total Purchases:", totalPurchases)

    // Get total sales
    let totalSales = 0
    if (collectionNames.includes("sales")) {
      totalSales = await db.collection("sales").countDocuments(saleQuery)
    }
    console.log("Total Sales:", totalSales)

    // Get total invoices
    let totalInvoices = 0
    if (collectionNames.includes("invoices")) {
      totalInvoices = await db.collection("invoices").countDocuments(invoiceQuery)
    }
    console.log("Total Invoices:", totalInvoices)

    // Get total sales amount
    let totalSalesAmount = 0
    if (collectionNames.includes("sales")) {
      // Determine which field contains the total amount
      const totalField = determineTotalField(sampleSale)
      console.log("Using total field:", totalField)

      if (totalField) {
        const result = await db
          .collection("sales")
          .aggregate([{ $match: saleQuery }, { $group: { _id: null, total: { $sum: `$${totalField}` } } }])
          .toArray()

        totalSalesAmount = result.length > 0 ? result[0].total : 0
      }
    }
    console.log("Total Sales Amount:", totalSalesAmount)

    // Get monthly sales data for the current year
    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1)
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59)

    let salesData = []
    if (collectionNames.includes("sales")) {
      const dateField = determineDateField(sampleSale)
      const totalField = determineTotalField(sampleSale)

      console.log("Using date field:", dateField)
      console.log("Using total field for monthly data:", totalField)

      if (dateField && totalField) {
        const matchQuery = { ...saleQuery }
        matchQuery[dateField] = {
          $gte: startOfYear,
          $lte: endOfYear,
        }

        try {
          salesData = await db
            .collection("sales")
            .aggregate([
              { $match: matchQuery },
              {
                $group: {
                  _id: { $month: `$${dateField}` },
                  total: { $sum: `$${totalField}` },
                },
              },
              { $sort: { _id: 1 } },
            ])
            .toArray()

          console.log("Monthly sales data:", salesData)
        } catch (error) {
          console.error("Error aggregating sales data:", error)
        }
      }
    }

    // Get monthly purchase data
    let purchaseData = []
    if (collectionNames.includes("purchases")) {
      const dateField = determineDateField(samplePurchase)
      const totalField = determineTotalField(samplePurchase)

      if (dateField && totalField) {
        const matchQuery = { ...purchaseQuery }
        matchQuery[dateField] = {
          $gte: startOfYear,
          $lte: endOfYear,
        }

        try {
          purchaseData = await db
            .collection("purchases")
            .aggregate([
              { $match: matchQuery },
              {
                $group: {
                  _id: { $month: `$${dateField}` },
                  total: { $sum: `$${totalField}` },
                },
              },
              { $sort: { _id: 1 } },
            ])
            .toArray()
        } catch (error) {
          console.error("Error aggregating purchase data:", error)
        }
      }
    }

    // Format the data for charts
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const formattedSalesData = months.map((month, index) => {
      const monthData = salesData.find((d) => d._id === index + 1)
      return {
        name: month,
        sales: monthData ? monthData.total : 0,
      }
    })

    // Combine sales and purchase data
    const combinedData = months.map((month, index) => {
      const salesForMonth = salesData.find((d) => d._id === index + 1)
      const purchasesForMonth = purchaseData.find((d) => d._id === index + 1)
      return {
        name: month,
        sales: salesForMonth ? salesForMonth.total : 0,
        purchases: purchasesForMonth ? purchasesForMonth.total : 0,
      }
    })

    return NextResponse.json({
      stats: {
        totalProducts,
        totalPurchases,
        totalSales,
        totalInvoices,
        totalSalesAmount,
      },
      salesData: formattedSalesData,
      combinedData,
    })
  } catch (error) {
    console.error("Dashboard API Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Helper function to build a query based on available fields
function buildQuery(sampleDoc: any, userId: string, userEmail: string, userName: string) {
  if (!sampleDoc) return {}

  const query: any = {}

  // Try different user identifier fields
  if (sampleDoc.userId) {
    try {
      query.userId = new ObjectId(userId)
    } catch (e) {
      query.userId = userId
    }
  } else if (sampleDoc.user_id) {
    try {
      query.user_id = new ObjectId(userId)
    } catch (e) {
      query.user_id = userId
    }
  } else if (sampleDoc.createdBy) {
    query.createdBy = userEmail || userName
  } else if (sampleDoc.created_by) {
    query.created_by = userEmail || userName
  } else if (sampleDoc.user) {
    query.user = userEmail || userName
  }

  // If no matching field, use $or to try multiple possibilities
  if (Object.keys(query).length === 0) {
    query.$or = [
      { userId: userId },
      { user_id: userId },
      { createdBy: userEmail },
      { created_by: userEmail },
      { user: userEmail },
      { email: userEmail },
      { createdBy: userName },
      { created_by: userName },
      { user: userName },
      { name: userName },
    ]

    // Also try with ObjectId
    try {
      const userIdObj = new ObjectId(userId)
      query.$or.push({ userId: userIdObj })
      query.$or.push({ user_id: userIdObj })
    } catch (e) {
      // Ignore if userId is not a valid ObjectId
    }
  }

  return query
}

// Helper function to determine which field contains the date
function determineDateField(sampleDoc: any) {
  if (!sampleDoc) return "createdAt"

  // Check for common date field names
  if (sampleDoc.saleDate) return "saleDate"
  if (sampleDoc.purchaseDate) return "purchaseDate"
  if (sampleDoc.date) return "date"
  if (sampleDoc.orderDate) return "orderDate"
  if (sampleDoc.invoiceDate) return "invoiceDate"
  if (sampleDoc.createdAt) return "createdAt"

  // Default to createdAt
  return "createdAt"
}

// Helper function to determine which field contains the total amount
function determineTotalField(sampleDoc: any) {
  if (!sampleDoc) return "total"

  // Check for common total field names
  if (sampleDoc.total) return "total"
  if (sampleDoc.totalAmount) return "totalAmount"
  if (sampleDoc.amount) return "amount"
  if (sampleDoc.price) return "price"
  if (sampleDoc.subtotal) return "subtotal"

  // If there's a field that looks like it might contain a total
  const possibleFields = ["total", "totalAmount", "amount", "price", "subtotal", "grandTotal"]
  for (const field of possibleFields) {
    if (sampleDoc[field] !== undefined && typeof sampleDoc[field] === "number") {
      return field
    }
  }

  // Default to total
  return "total"
}

